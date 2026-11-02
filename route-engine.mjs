import { isSevereHarm } from './emotion-engine.mjs';
/** Conservative, local relationship tracking for plain-language replies.
 * No additional model calls or fragile JSON schema are required.
 * Neither score nor flags can override character consent in the dialogue.
 */
const has=(text,re)=>re.test(String(text||''));
const REJECTION=/(?:\b(?:no|stop|don['’]t|not ready|uncomfortable|leave me|back off|can['’]t|cannot)\b|не\s+(?:хочу|готов[аы]?|могу|соглас[еан]|стоит)|прекрати|отойди|отстань|отказываюсь|слишком рано|неприятно|пожалуйста,?\s*нет)/i;
const HURTFUL=/(?:\b(?:shut up|idiot|stupid|hate you|worthless|loser)\b|ненавижу|туп(?:ой|ая)|дурак|дура|заткнись|мерзк(?:ий|ая)|бесишь|ничтожество|идиот)/i;
const APOLOGY=/(?:\b(?:sorry|apologi[sz]e|forgive me)\b|прости|извини|прощения|виноват[а]?)/i;
const RESPECT=/(?:\b(?:respect your boundaries|won['’]t push|no pressure|as you wish)\b|не буду настаивать|уважаю твой выбор|если тебе комфортно|как тебе удобно|понимаю твои границы)/i;
const CARE=/(?:\b(?:thank you|thanks|help you|here for you|support you|take care of you)\b|спасибо|благодарю|помогу|поддержу|береги себя|забочусь|выслушаю|угощу|угостить|подарить)/i;
const FLIRT=/(?:\b(?:love you|like you|beautiful|handsome|miss you|kiss you|date me|go out with me)\b|люблю тебя|ты мне нравишься|красив(?:ый|ая)|прекрасн(?:ый|ая)|скучал[а]?|поцел(?:уй|овать)|свидание|встречаться)/i;
const PROPOSAL=/(?:\b(?:be my (?:girlfriend|boyfriend|partner)|date me|be together|go out with me)\b|давай встречаться|будь мо(?:ей|им)|будешь (?:моей|моим)|хочешь встречаться|хочешь быть со мной|станешь моей|начнем отношения)/i;
const ACCEPT=/(?:\b(?:yes|i agree|i want to|i['’]d love to|i love you too)\b|(?:^|[.!?\s])да(?:[,.!\s]|$)|я согласн(?:а|ен)|я тоже тебя люблю|хочу быть с тобой|с удовольствием|давай попробуем|взаимно)/i;
const ACTION_CARE=/(?:\b(?:hug|gift|tea|help|comfort)\b|обнять|обнимаю|угостить|подарить|поддержать|утешить|помочь|согреть)/i;
const SENSITIVE=/(?:\b(?:kiss|touch|hold hands)\b|поцеловать|целую|касаться|потрогать|прикоснуться)/i;

export function isBrokenCompletion(text){
 const value=String(text||'').trim();
 if(!value)return true;
 if(/^\*\s*\p{L}{0,3}$/u.test(value))return true; // e.g. screenshot: "*Ч"
 if(/^\*[^*]{0,55}$/u.test(value))return true; // unfinished action, no dialogue
 if(/^\{\s*$/u.test(value)||/^\[\s*$/u.test(value))return true;
 return false;
}

/** Pure suggestion, not an absolute rule. The model is still responsible for
 * responding in character and setting its own boundaries. */
export function inferRelationshipDelta(event,reply,route={},recent=[]){
 const input=String(event?.text||'');
 const spoken=String(reply?.text||'');
 const kind=event?.kind||'';
 const rejected=has(spoken,REJECTION);
 const aggressive=has(input,HURTFUL);
 const prior=recent.filter(x=>x.role==='user').slice(-3).map(x=>x.text||'');
 const repeated=prior.filter(x=>x.trim()===input.trim()).length>=2;
 const result={};
 if(!['message','action'].includes(kind))return result;
 if(isSevereHarm(input)){result.trustDelta=-3;result.tensionDelta=3;result.romanceDelta=-1;return result;}
 if(aggressive){result.trustDelta=-2;result.tensionDelta=2;return result;}
 if(has(input,APOLOGY)){
  if(!rejected){result.trustDelta=1;result.tensionDelta=-2;}
  return result;
 }
 if(has(input,RESPECT)){result.trustDelta=1;result.tensionDelta=-1;return result;}
 if(has(input,PROPOSAL)){
  if(rejected){result.rejectedProposal=true;return result;}
  if((route.trust??0)>=55&&(route.romance??0)>=55&&(route.tension??0)<45&&has(spoken,ACCEPT)){
   result.dating=true;result.confessed=true;result.romanceDelta=1;
  }
  return result;
 }
 if(rejected){ // Respect character's refusal: no score farming from unwanted touches.
  if(has(input,SENSITIVE)||has(input,FLIRT))result.tensionDelta=1;
  return result;
 }
 if(repeated)return result;
 if(has(input,CARE)||kind==='action'&&has(input,ACTION_CARE))result.trustDelta=1;
 if(has(input,FLIRT)&&!has(input,PROPOSAL)&&(route.trust??0)>=20)result.romanceDelta=1;
 if(has(input,SENSITIVE)&&(route.trust??0)<20)delete result.romanceDelta;
 return result;
}
