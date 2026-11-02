import { DEFAULTS } from './core.mjs';
export const PROFILE_FIELDS=Object.keys(DEFAULTS).filter(k=>!['enabled','storageId'].includes(k));
export function captureProfile(s){return Object.fromEntries(PROFILE_FIELDS.map(k=>[k,structuredClone(s[k]??DEFAULTS[k])]));}
export function ensureProfiles(s){if(!Array.isArray(s.companionProfiles)||!s.companionProfiles.length){s.companionProfiles=[{id:'legacy',name:s.source==='own'?(s.ownName||'Мой персонаж'):'Персонаж из чата',namespace:'',values:captureProfile(s)}];s.activeCompanion='legacy';}if(!s.companionProfiles.some(p=>p.id===s.activeCompanion))s.activeCompanion=s.companionProfiles[0].id;}
export function saveProfile(s){const p=s.companionProfiles?.find(p=>p.id===s.activeCompanion);if(p)p.values=captureProfile(s);}
export function activateProfile(s,id){const target=s.companionProfiles.find(p=>p.id===id);if(!target)throw Error('Профиль не найден.');saveProfile(s);Object.assign(s,structuredClone(DEFAULTS),{enabled:s.enabled,storageId:s.storageId},structuredClone(target.values));s.activeCompanion=id;return target;}
export function addProfile(s,id,name){if(s.companionProfiles.some(p=>p.id===id))throw Error('Профиль уже существует.');const values={...structuredClone(DEFAULTS),source:'own',follow:false,ownName:name};delete values.enabled;delete values.storageId;const p={id,name,namespace:'profile:'+id+':',values};s.companionProfiles.push(p);activateProfile(s,id);return p;}
export function identityNamespace(s){return s.companionProfiles?.find(p=>p.id===s.activeCompanion)?.namespace||'';}
export function guessEmotion(name){const s=name.toLowerCase().replace(/\.png$/,'');for(const [emotion,pattern] of Object.entries({neutral:/neutral|normal|нейтр|обыч|спокой/,happy:/happy|joy|smile|радос|улыб/,sad:/sad|cry|груст|печал|плач/,angry:/angry|anger|злос|злая|злой|серди/,shy:/shy|blush|embarrass|смущ/,playful:/playful|teas|игрив|озор/}))if(pattern.test(s))return emotion;return '';}

export function restoreProfile(s){ensureProfiles(s);const p=s.companionProfiles.find(p=>p.id===s.activeCompanion);Object.assign(s,structuredClone(p.values));return p;}
