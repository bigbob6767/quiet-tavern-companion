import { isBrokenCompletion } from './route-engine.mjs';

/**
 * The model is not a reliable JSON serializer. Recover only the visible
 * dialogue from common broken envelopes; NEVER display control fields.
 * This module never evals model text and does not touch the main Tavern chat.
 */
const TECH_KEYS='emotion|choices|trustDelta|romanceDelta|tensionDelta|affinityDelta|relationshipDelta|affectionDelta|routeNote|relationshipNote|dating|confessed|rejectedProposal|relationship';
const TECH_FIELD=new RegExp(`["'](?:${TECH_KEYS})["']\\s*:`, 'i');
const ENTRY_FIELD=/["'](?:text|dialogue|content)["']\s*:/gi;
const ENTRY_DETECT=/["'](?:text|dialogue|content)["']\s*:/i;
const WRAPPED=/^\s*(?:\[\s*(?:\{|["'])|\{\s*(?:["']|text\s*:|emotion\s*:)|["'](?:text|emotion|choices|trustDelta|romanceDelta|tensionDelta|routeNote)["']\s*:|```\s*(?:json)?)/i;

function jsonText(raw){
 if(typeof raw==='string')return raw;
 if(Array.isArray(raw))return raw.map(x=>typeof x==='string'?x:(x?.text??'')).filter(x=>typeof x==='string').join('\n');
 if(raw&&typeof raw==='object'){
  if(typeof raw.text==='string')return raw.text;
  if(typeof raw.content==='string')return raw.content;
  if(Array.isArray(raw.content))return jsonText(raw.content);
 }
 return '';
}

function decodeStringValue(input){
 const trimmed=input.trim();
 if(!trimmed)return '';
 try{return JSON.parse('"'+trimmed.replace(/(?<!\\)"/g,'\\"')+'"');}
 catch{return trimmed.replace(/\\n/g,'\n').replace(/\\t/g,'\t').replace(/\\r/g,'').replace(/\\"/g,'"').replace(/\\\\/g,'\\');}
}

/** Scan a JSON-like quoted value; an unescaped quote inside dialogue is
 * considered literal unless followed by a JSON delimiter or the end. */
function readQuoted(input,position){
 const quote=input[position];
 if(quote!=='"'&&quote!=="'")return null;
 let content='';
 let i=position+1;
 for(;i<input.length;i++){
  const ch=input[i];
  if(ch==='\\'&&i+1<input.length){content+=ch+input[++i];continue;}
  if(ch===quote){
   const rest=input.slice(i+1).match(/^\s*/)?.[0].length||0;
   const next=input[i+1+rest];
   if(next===undefined||next===']'||next==='}'||
      (next===','&&/^,\s*(?:["']|[}\]]|$)/.test(input.slice(i+1)))){
    return {value:decodeStringValue(content),end:i+1,complete:true};
   }
   // Misplaced quotes inside dialogue: don't terminate a JSON string here.
  }
  content+=ch;
 }
 return {value:decodeStringValue(content),end:i,complete:false};
}

function readArray(input,position){
 let i=position+1;
 const parts=[];
 let count=0;
 while(i<input.length&&count++<100){
  while(/[\s,]/.test(input[i]||'')&&i<input.length)i++;
  if(i>=input.length||input[i]===']')break;
  if(input[i]==='"'||input[i]==="'"){
   const part=readQuoted(input,i);
   if(!part||!part.value)break;
   parts.push(part.value);
   i=part.end;
   if(!part.complete)break;
   continue;
  }
  break;
 }
 return parts.join('\n');
}

function stripTechnicalTail(text){
 if(typeof text!=='string')return '';
 let value=text.trim();
 const match=TECH_FIELD.exec(value);
 if(match){
  // Only treat as a leaked JSON property when preceded by plausible JSON
  // punctuation (e.g. the screenshot's `"],"trustDelta":1`).
  const before=value.slice(0,match.index);
  if(/(?:[,}\]]\s*|["']\s*,?\s*|^)$/.test(before)){
   value=before.replace(/[\s,\]\}\[\{]+$/g,'').replace(/["']\s*$/g,'').trim();
  }
 }
 return value;
}

function extractDialogueField(raw){
 // On malformed/truncated JSON, still extract a `text` string or string list.
 ENTRY_FIELD.lastIndex=0;
 let m;
 while((m=ENTRY_FIELD.exec(raw))){
  let i=m.index+m[0].length;
  while(/\s/.test(raw[i]||'')&&i<raw.length)i++;
  if(raw[i]==='"'||raw[i]==="'"){
   const p=readQuoted(raw,i);
   if(p?.value)return stripTechnicalTail(p.value);
  }
  if(raw[i]==='['){
   const list=readArray(raw,i);
   if(list)return stripTechnicalTail(list);
  }
 }
 return '';
}

function parseCandidate(raw){
 const fence=raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
 const value=fence?fence[1].trim():raw.trim();
 for(const candidate of [value]){
  try{return JSON.parse(candidate);}catch{}
 }
 // Prefix/suffix outside a well-formed JSON object or array.
 for(const opener of ['{','[']){
  const start=value.indexOf(opener);
  const last=value.lastIndexOf(opener==='{'?'}':']');
  if(start<0||last<=start)continue;
  try{return JSON.parse(value.slice(start,last+1));}catch{}
 }
 return undefined;
}

export function unwrapModelReply(raw){
 let value=raw;
 for(let i=0;i<6;i++){
  if(Array.isArray(value)){
   if(value.every(x=>typeof x==='string'))return {text:value.join('\n')};
   value=value.find(x=>x&&typeof x==='object')??value[0];
  }else if(value&&typeof value==='object'){
   if(typeof value.text==='string'||Array.isArray(value.text))return value;
   if(typeof value.content==='string')return {text:value.content};
   value=value.reply??value.message??value.data??value.content;
  }else break;
 }
 return undefined;
}

export function recoverModelReply(raw){
 let content=jsonText(raw);
 if(!content.trim())throw new Error('Модель вернула пустой ответ.');
 content=content.replace(/<think>[\s\S]*?<\/think>/gi,'').trim();
 if(!content)throw new Error('Модель вернула пустой ответ.');
 const parsed=parseCandidate(content);
 if(parsed!==undefined){
  const object=unwrapModelReply(parsed);
  if(!object)throw new Error('Модель вернула JSON без реплики. Нажми «Повторить».');
  const body=typeof object.text==='string'?object.text:
   Array.isArray(object.text)?object.text.filter(x=>typeof x==='string').join('\n'):'';
  const text=stripTechnicalTail(body);
  if(!text)throw new Error('Модель вернула JSON без реплики. Нажми «Повторить».');
  return {text,object};
 }
 const structured=WRAPPED.test(content)||TECH_FIELD.test(content)||ENTRY_DETECT.test(content);
 if(structured){
  const text=extractDialogueField(content);
  if(text)return {text,object:null}; // Malformed reply; discard all untrusted metadata.
  // Some models emit normal prose first, then append bare JSON metadata.
  const prose=stripTechnicalTail(content);
  if(prose&&prose!==content&&!WRAPPED.test(prose)&&!ENTRY_DETECT.test(prose))return {text:prose,object:null};
  throw new Error('Модель вернула повреждённый формат ответа. Нажми «Повторить».');
 }
 const text=stripTechnicalTail(content);
 if(!text)throw new Error('Модель вернула пустой ответ.');
 return {text,object:null};
}

/** Also used when showing previously saved replies from old releases. */
export function safeDisplayReply(content){
 if(typeof content!=='string')return '';
 try{const text=recoverModelReply(content).text;return isBrokenCompletion(text)?'Предыдущая реплика была оборвана.':text;}
 catch{return 'Ответ модели был повреждён. Нажми «Повторить», чтобы получить реплику заново.';}
}
