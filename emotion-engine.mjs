/**
 * Local expression inference for natural-language responses.
 * No JSON, external model call or additional tokens are necessary.
 * These are conservative heuristics; character-specific reactions in dialogue
 * take priority over generic action defaults (except obvious physical harm).
 */
const has = (text, re) => re.test(String(text || ''));

// Use broad stems to support Russian inflections and common English verbs.
export const HARM = /(?:откус\p{L}*|укус\p{L}*|покус\p{L}*|удар\p{L}*|пнул\p{L}*|пина\p{L}*|избил\p{L}*|избива\p{L}*|порез\p{L}*|отрез\p{L}*|отруб\p{L}*|зарез\p{L}*|ран\p{L}*|калеч\p{L}*|искалеч\p{L}*|сломал\p{L}*|слома\p{L}*|душил\p{L}*|душу|пырнул\p{L}*|вырвал\p{L}*|раздавил\p{L}*|кров\p{L}*|убил\p{L}*|убива\p{L}*|\b(?:bit(?:e|ten|ing|es)?|stab(?:s|bed|bing)?|punch(?:ed|es|ing)?|kick(?:ed|s|ing)?|slap(?:ped|s|ping)?|attack(?:ed|s|ing)?|cut off|rip off|hurt(?:s|ing)?|break(?:s|ing)? (?:a|his|her) (?:finger|arm|hand))\b)/iu;
const ANGER = /(?:зл\p{L}*|разозл\p{L}*|сердит\p{L}*|рассерд\p{L}*|ярост\p{L}*|бесит\p{L}*|взбес\p{L}*|гнев\p{L}*|возмущ\p{L}*|оттолк\p{L}*|прекрати\p{L}*|не\s+смей|отстань|отпусти|\b(?:angry|furious|enraged|stop|back off|don't touch|how dare)\b)/iu;
const PAIN_SADNESS = /(?:больн\p{L}*|болит\p{L}*|боли\b|плач\p{L}*|слез\p{L}*|слёз\p{L}*|разрыдал\p{L}*|рыда\p{L}*|всхлип\p{L}*|печаль\p{L}*|груст\p{L}*|страшно|страх|испуг\p{L}*|побледн\p{L}*|дрож\p{L}*|вздрог\p{L}*|\b(?:hurt|pain|cry|cries|tears|sad|afraid|scared|trembl\w*|flinch\w*)\b)/iu;
const SHY = /(?:смущ\p{L}*|красне\p{L}*|покрасне\p{L}*|зардел\p{L}*|заалел\p{L}*|румянец|зали\p{L}*сь\s+краск\p{L}*|прячет\s+глаз\p{L}*|отводит\s+взгляд|стесня\p{L}*|\b(?:blush\w*|embarrass\w*|shy|fluster\w*)\b)/iu;
const PLAYFUL = /(?:подмиг\p{L}*|лукав\p{L}*|хитр\p{L}*|игрив\p{L}*|хихик\p{L}*|дразн\p{L}*|шутл\p{L}*|с\s+усмешк\p{L}*|\b(?:wink\w*|teas\w*|playful|mischievous|giggl\w*)\b)/iu;
const HAPPY = /(?:радост\p{L}*|обрад\p{L}*|счастлив\p{L}*|улыб\p{L}*|сме\p{L}*сь|рассме\p{L}*|обнима\p{L}*|приятно|как\s+здорово|\b(?:happy|smil\w*|glad|laugh\w*|joyful|delight\w*|hug\w*)\b)/iu;
const KISS = /(?:целую\b|целуешь\b|поцел\p{L}*|чмок\p{L}*|\b(?:kiss\w*|smooch\w*)\b)/iu;
const FLIRT = /(?:флирт\p{L}*|комплимент\p{L}*|люблю\s+тебя|ты\s+красив\p{L}*|\b(?:flirt\w*|compliment\w*|love you)\b)/iu;
const AFFECTION = /(?:обня\p{L}*|обнима\p{L}*|поглад\p{L}*|поглаж\p{L}*|подар\p{L}*|угост\p{L}*|\b(?:hug\w*|cuddl\w*|pat\w*|gift\w*)\b)/iu;
const TEASE = /(?:подкол\p{L}*|поддразн\p{L}*|дразн\p{L}*|шут\p{L}*|пошут\p{L}*|\b(?:teas\w*|jok\w*)\b)/iu;
const CALM = /(?:спокойн\p{L}*|невозмутим\p{L}*|безразличн\p{L}*|равнодушн\p{L}*|не\s+отреагир\p{L}*|не\s+шелохнул\p{L}*|\b(?:calm|unfazed|indifferent|unmoved)\b)/iu;
const REFUSAL = /(?:не\s+(?:хочу|надо|соглас\p{L}*|трогай)|отойди|отстань|убери\s+руки|прекрати|\b(?:no|stop|don't|leave me alone)\b)/iu;

function stripNegatedAnger(text){
 return String(text||'').replace(/\bне\s+(?:злюсь|злится|сердит\p{L}*|разозл\p{L}*|гнева\p{L}*)/giu,'');
}
function stripNegatedDistress(text){
 return String(text||'').replace(/\bне\s+(?:больно|страшно|грустно|испуг\p{L}*|плач\p{L}*)/giu,'');
}
function stripNegatedShyness(text){
 return String(text||'').replace(/\bне\s+(?:смущ\p{L}*|стесня\p{L}*|красне\p{L}*)/giu,'');
}

export function isSevereHarm(text){return has(text,HARM);}

/**
 * @param {object} event - The actual user action/message.
 * @param {object} reply - A parsed model reply (usually plain text).
 * @param {object} route - Character relationship context, optionally supplied.
 * @returns {'neutral'|'happy'|'sad'|'angry'|'shy'|'playful'}
 */
export function inferEmotion(event={},reply={},route={}){
 const speech=String(reply?.text||'');
 const action=String(event?.text||'');
 const requested=String(reply?.emotion||'neutral');
 if(['happy','sad','angry','shy','playful'].includes(requested))return requested;

 // The model's written reaction outranks generic assumptions.
 if(has(stripNegatedAnger(speech),ANGER))return 'angry';
 if(has(stripNegatedDistress(speech),PAIN_SADNESS))return 'sad';
 if(has(stripNegatedShyness(speech),SHY))return 'shy';

 // Violence cannot silently produce the same visual reaction as a greeting.
 // Anger is a practical default when the story does not describe a clear
 // emotional reaction. If the response describes distress, that wins above.
 if(has(action,HARM))return 'angry';
 if(has(speech,CALM))return 'neutral';
 if(has(speech,REFUSAL)&&has(action,KISS))return 'angry';
 if(has(speech,PLAYFUL))return 'playful';
 if(has(speech,HAPPY))return 'happy';

 // Actions are only fallback hints. Touches on a sprite have no automatic
 // sexual or romantic meaning; use what the model actually said instead.
 if(event?.kind==='touch'||event?.kind==='tap'||event?.kind==='comment')return 'neutral';
 if(has(action,TEASE))return 'playful';
 if(has(action,KISS)||has(action,FLIRT)){
  // Warm established routes make overtly affectionate reactions more likely.
  // A new acquaintance more often looks shy or surprised.
  if((route?.romance??0)>=65&&(route?.trust??0)>=55)return 'happy';
  return 'shy';
 }
 if(has(action,AFFECTION))return 'happy';
 return 'neutral';
}
