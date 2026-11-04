import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import * as core from '../core.mjs';import * as profiles from '../profiles.mjs';import * as touchHelpers from '../touch.mjs';import * as presentation from '../presentation.mjs';import * as authoring from '../authoring.mjs';import * as themes from '../themes.mjs';import * as backupHelpers from '../backup.mjs';import * as perfHelpers from '../performance.mjs';import * as routeEngine from '../route-engine.mjs';import * as emotionEngine from '../emotion-engine.mjs';const decorateLabel=()=>false;const decorateThemeCard=()=>false;
class Element {
 constructor(){this.children=[];this.hidden=false;this.value='';this.dataset={};this.classList={toggle(){},add(){},remove(){}};this.style={setProperty(){}};this.nodes=new Map();}
 set innerHTML(v){for(const m of v.matchAll(/data-qtc="([^"]+)"/g))this.nodes.set(m[1],new Element());}
 querySelector(s){const m=s.match(/data-qtc="([^"]+)"/);if(m)return this.nodes.get(m[1]);for(const child of this.children){if(s.startsWith('.')&&child.className===s.slice(1))return child;const nested=child.querySelector?.(s);if(nested)return nested;}return null;}
 click(){this.clicked=true;this.onclick?.();}
 querySelectorAll(){return [];}setAttribute(){}removeAttribute(){}append(...n){this.children.push(...n)}replaceChildren(){this.children=[]}showModal(){this.open=true}close(){this.open=false}
}
function setup(savedSettings=null,existingData=null,opts={}){const data=existingData||new Map(),events=new Map(),timers=new Set();const api={extensionSettings:savedSettings?{quiet_tavern_companion:structuredClone(savedSettings)}:{},characters:[{avatar:'mika.png',name:'Мика',data:{personality:'Сдержанная'}}],characterId:0,chatId:'A',chat:[{mes:'Привет',is_user:true,name:'User'}],name1:'Аня',eventTypes:{APP_READY:'ready',CHAT_CHANGED:'chat',MESSAGE_RECEIVED:'message',GENERATION_STARTED:'start',GENERATION_ENDED:'end'},eventSource:{on(k,fn){events.set(k,fn)}},saveSettingsDebounced(){},generateRaw:async()=>'{"text":"От неожиданности я смутилась.","emotion":"shy"}'};const body=new Element;const globals={...core,...profiles,...touchHelpers,...presentation,...authoring,...themes,...backupHelpers,...perfHelpers,...routeEngine,...emotionEngine,decorateLabel,decorateThemeCard,LocalStore:class{async get(k){return data.get(k)}async set(k,v){data.set(k,structuredClone(v))}async remove(k){data.delete(k)}},SillyTavern:{getContext:()=>api},document:{body,createElement:()=>new Element,querySelector:()=>new Element},window:{innerHeight:800,addEventListener(){}},crypto:Object.prototype.hasOwnProperty.call(opts,'crypto')?opts.crypto:{randomUUID:()=> 'test-account'},structuredClone,AbortController,Blob,URL,createImageBitmap:async()=>({width:1,height:1,close(){}}),console,setTimeout(fn,ms){const t=setTimeout(fn,ms);timers.add(t);return t},clearTimeout(t){clearTimeout(t);timers.delete(t)},confirm:()=>true};const context=vm.createContext(globals);let source=fs.readFileSync(new URL('../index.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');source+='\nglobalThis.testAPI={initialize,ask,refresh,render,invalidate,showTitle,startMeeting,leave,writeSpeech,stopSpeech,openSettings,uploadImage,person,touch,changeProfile:async(id,name)=>{invalidate();if(name)addProfile(settings,id,name);else activateProfile(settings,id);await refresh();},get:()=>({scope,conversation,root,settings,busy,titleOpen,welcome}),setupMiniDragging,positionMini,setSnapshot:(s)=>snapshot=s};';vm.runInContext(source,context);return {api,context,events,data,body,testAPI:context.testAPI,cleanup:()=>{for(const t of timers)clearTimeout(t)}};}
test('Real action generation uses current API, does not add plot messages, saves separate reply',async()=>{const env=setup();try{await env.testAPI.initialize();let request;env.api.generateRaw=async p=>{request=p;return '{"text":"Я смутилась от поцелуя.","emotion":"shy"}'};await env.testAPI.ask({kind:'action',text:'Поцеловать тебя'});assert.equal(JSON.parse(request.prompt).event.text,'Поцеловать тебя');assert.equal(env.api.chat.length,1);assert.equal(env.testAPI.get().conversation.memory.length,2);assert.equal(env.testAPI.get().conversation.memory[1].text,'Я смутилась от поцелуя.');}finally{env.cleanup()}});
test('Changing chat discards in-flight reply',async()=>{const env=setup();try{await env.testAPI.initialize();let resolve;env.api.generateRaw=()=>new Promise(r=>resolve=r);const pending=env.testAPI.ask({kind:'action',text:'Обнять'});env.testAPI.invalidate();env.api.chatId='B';await env.testAPI.refresh();resolve('{"text":"OLD CHAT RESPONSE","emotion":"happy"}');await pending;assert.equal(env.testAPI.get().conversation.memory.length,0);assert.equal(env.testAPI.get().busy,false);}finally{env.cleanup()}});
test('Separate profile uses service, abort signal and never switches main connection',async()=>{const env=setup();try{await env.testAPI.initialize();env.testAPI.get().settings.profile='cheap-profile';let request;env.api.ConnectionManagerRequestService={async sendRequest(...args){request=args;return {content:'{"text":"Спасибо за чай!","emotion":"happy"}'}}};env.api.generateRaw=()=>{throw Error('Wrong route')};await env.testAPI.ask({kind:'action',text:'Угостить чаем'});assert.equal(request[0],'cheap-profile');assert.equal(request[3].stream,false);assert.ok(request[3].signal instanceof AbortSignal);assert.equal(env.testAPI.get().conversation.memory[1].text,'Спасибо за чай!');}finally{env.cleanup()}});
test('Failure retains separate memory and makes retry available',async()=>{const env=setup();try{await env.testAPI.initialize();env.api.generateRaw=async()=>{throw Error('401')};await env.testAPI.ask({kind:'action',text:'Поцеловать'});assert.equal(env.testAPI.get().conversation.memory.length,0);assert.equal(env.testAPI.get().busy,false);const root=env.testAPI.get().root;assert.equal(root.querySelector('[data-qtc="retry"]').hidden,false);}finally{env.cleanup()}});

test('Explicit visible PNG button opens the native picker in the same click',async()=>{const env=setup();try{await env.testAPI.initialize();await env.testAPI.openSettings();function all(n){return [n,...n.children.flatMap(all)]}const nodes=all(env.body);const upload=nodes.find(n=>n.textContent==='＋ Загрузить PNG');assert.ok(upload);assert.equal(upload.hidden,false);assert.equal(upload.className,'qtc-upload-button');upload.click();assert.ok(nodes.some(n=>n.type==='file'&&n.clicked));assert.ok(nodes.some(n=>n.textContent==='＋ Загрузить несколько PNG'));}finally{env.cleanup()}});
test('Uploaded PNGs persist independently across profile switches and legacy migration',async()=>{const env=setup();try{await env.testAPI.initialize();const png=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'});await env.testAPI.uploadImage('neutral',png);assert.ok(env.data.has('png:card:mika.png:neutral'));await env.testAPI.changeProfile('two','Луна');await env.testAPI.uploadImage('happy',png);assert.ok(env.data.has('png:profile:two:own:happy'));await env.testAPI.changeProfile('legacy');assert.equal(env.testAPI.person().id,'card:mika.png');assert.ok(env.data.has('png:card:mika.png:neutral'));assert.ok(env.data.has('png:profile:two:own:happy'));}finally{env.cleanup()}});
test('Batch uploader stores two PNGs under separate emotions in the selected profile',async()=>{const env=setup();try{await env.testAPI.initialize();await env.testAPI.openSettings();function all(n){return [n,...n.children.flatMap(all)]}const input=all(env.body).find(n=>n.type==='file'&&n.multiple);function png(name){const b=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'});b.name=name;return b}input.files=[png('neutral.png'),png('happy.png')];input.onchange();const save=all(env.body).find(n=>n.textContent==='Сохранить выбранные PNG');await save.onclick();assert.ok(env.data.has('png:card:mika.png:neutral'));assert.ok(env.data.has('png:card:mika.png:happy'));}finally{env.cleanup()}});

test('Reload restores non-neutral-only PNG and the same selected custom profile',async()=>{const first=setup();let second;try{await first.testAPI.initialize();await first.testAPI.changeProfile('luna','Луна');const png=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'});await first.testAPI.uploadImage('happy',png);second=setup(first.testAPI.get().settings,first.data);await second.testAPI.initialize();assert.equal(second.testAPI.person().id,'profile:luna:own');assert.equal(second.testAPI.get().root.querySelector('[data-qtc="sprite"]').hidden,false);assert.equal(second.testAPI.get().root.querySelector('[data-qtc="placeholder"]').hidden,true);}finally{first.cleanup();second?.cleanup()}});
test('Dry-run generation does not block companion actions',async()=>{const env=setup();try{await env.testAPI.initialize();env.events.get('start')('normal',{},true);await env.testAPI.ask({kind:'action',text:'Угостить'});assert.equal(env.testAPI.get().conversation.memory.length,2);}finally{env.cleanup()}});
test('Stopped streaming processor does not block companion',async()=>{const env=setup();try{await env.testAPI.initialize();env.api.streamingProcessor={isFinished:false,isStopped:true};await env.testAPI.ask({kind:'action',text:'Обнять'});assert.equal(env.testAPI.get().conversation.memory.length,2);}finally{env.cleanup()}});

test('Welcome retains saved character even when host reopens another character',async()=>{const saved={...core.DEFAULTS,storageId:'old',character:'mika.png'};const env=setup(saved);try{env.api.characters.push({avatar:'other.png',name:'Другой'});env.api.characterId=1;await env.testAPI.initialize();assert.equal(env.testAPI.person().id,'card:mika.png');assert.equal(env.testAPI.get().settings.character,'mika.png');}finally{env.cleanup()}});
test('Newer local settings backup restores selected profile after delayed server save',async()=>{const first=setup();let second;try{await first.testAPI.initialize();const stale=structuredClone(first.testAPI.get().settings);await first.testAPI.changeProfile('luna','Луна');const latest=structuredClone(first.testAPI.get().settings);latest.savedAt=stale.savedAt+100;first.data.set('settings-backup',latest);second=setup(stale,first.data);await second.testAPI.initialize();assert.equal(second.testAPI.person().id,'profile:luna:own');}finally{first.cleanup();second?.cleanup()}});
test('A real main-chat generation still blocks requests',async()=>{const env=setup();try{await env.testAPI.initialize();env.events.get('start')('normal',{},false);let called=false;env.api.generateRaw=async()=>{called=true;return 'x'};await env.testAPI.ask({kind:'action',text:'Обнять'});assert.equal(called,false);assert.match(env.testAPI.get().root.querySelector('[data-qtc="status"]').textContent,/Дождись/);}finally{env.cleanup()}});

test('A chest click passes a specific touch event to the model',async()=>{const env=setup();try{await env.testAPI.initialize();const png=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'});await env.testAPI.uploadImage('neutral',png);const sprite=env.testAPI.get().root.querySelector('[data-qtc="sprite"]');sprite.naturalWidth=100;sprite.naturalHeight=200;sprite.getBoundingClientRect=()=>({left:0,top:0,width:100,height:200});let captured;env.api.generateRaw=async p=>{captured=JSON.parse(p.prompt);return '{"text":"Эй, осторожнее.","emotion":"shy"}'};env.testAPI.touch({detail:1,clientX:50,clientY:100});await new Promise(r=>setTimeout(r,550));assert.equal(captured.event.kind,'touch');assert.equal(captured.event.touches[0].zone,'chest');assert.equal(env.api.chat.length,1);}finally{env.cleanup()}});

test('Title has no automatic model request; Start greets and Leave returns to Tavern',async()=>{const e=setup();try{let calls=0;e.api.generateRaw=async()=>{calls++;return '{"text":"Привет","emotion":"happy"}'};await e.testAPI.initialize();assert.equal(e.testAPI.get().titleOpen,true);assert.equal(calls,0);e.testAPI.startMeeting();await new Promise(r=>setTimeout(r,20));assert.equal(calls,1);assert.equal(e.testAPI.get().titleOpen,false);e.testAPI.leave();assert.equal(e.testAPI.get().welcome,false);}finally{e.cleanup()}});
test('Fast forward renders separate action and dialogue as safe text',async()=>{const e=setup();try{await e.testAPI.initialize();e.testAPI.writeSpeech('*Улыбается* Привет <img src=x>');e.testAPI.stopSpeech();const p=e.testAPI.get().root.querySelector('[data-qtc="speech"]').children;assert.equal(p[0].className,'qtc-narration');assert.equal(p[0].textContent,'Улыбается');assert.equal(p[1].textContent,'Привет <img src=x>');}finally{e.cleanup()}});
test('Manual title menu is visible in chat-only placement',async()=>{const e=setup({...core.DEFAULTS,placement:'chat'});try{await e.testAPI.initialize();assert.equal(e.testAPI.get().titleOpen,false);e.testAPI.showTitle();assert.equal(e.testAPI.get().root.hidden,false);assert.equal(e.testAPI.get().root.querySelector('[data-qtc="titleScreen"]').hidden,false);}finally{e.cleanup()}});
test('Upgrade lightens preset pink but retains custom color and identity',async()=>{for(const color of ['#503243','#123456']){const e=setup({...core.DEFAULTS,theme:'pink',panel:color,storageId:'retained'});try{await e.testAPI.initialize();assert.equal(e.testAPI.get().settings.panel,color==='#503243'?'#fff6f8':color);assert.equal(e.testAPI.get().settings.storageId,'retained');}finally{e.cleanup()}}});
test('Separate title PNG survives reload without becoming an emotion',async()=>{const first=setup();let second;try{await first.testAPI.initialize();const png=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'});await first.testAPI.uploadImage('neutral',png);await first.testAPI.uploadImage('title',png);assert.ok(first.data.has('png:card:mika.png:title'));second=setup(first.testAPI.get().settings,first.data);await second.testAPI.initialize();const root=second.testAPI.get().root;assert.equal(root.querySelector('[data-qtc="titleSprite"]').hidden,false);assert.equal(root.querySelector('[data-qtc="sprite"]').hidden,true);await second.testAPI.ask({kind:'greet',text:'Привет'});assert.equal(root.querySelector('[data-qtc="titleSprite"]').hidden,true);assert.equal(root.querySelector('[data-qtc="sprite"]').hidden,false);}finally{first.cleanup();second?.cleanup()}});
test('Suggested reply buttons submit the chosen text and never write into the main chat',async()=>{const env=setup();try{await env.testAPI.initialize();env.testAPI.get().settings.suggestReplies=true;let captured;env.api.generateRaw=async p=>{captured=JSON.parse(p.prompt);return '{"text":"Пойдём?","choices":["Пойдём!","Пока останусь"],"emotion":"happy"}'};await env.testAPI.ask({kind:'greet',text:'Привет'});const box=env.testAPI.get().root.querySelector('[data-qtc="choices"]');assert.equal(box.children.length,2);assert.equal(box.hidden,false);box.children[0].click();await new Promise(r=>setTimeout(r,10));assert.equal(captured.event.text,'Пойдём!');assert.equal(captured.event.kind,'message');assert.equal(env.api.chat.length,1);}finally{env.cleanup()}});
test('AI character creation previews before applying and preserves filled fields',async()=>{const env=setup();try{await env.testAPI.initialize();const settings=env.testAPI.get().settings;Object.assign(settings,{source:'own',ownName:'Слоппи',personality:'Любит кино',manner:'',relation:''});await env.testAPI.openSettings();let sent;env.api.generateRaw=async p=>{sent=p;return '{"ownName":"Другой","personality":"Другая","manner":"Иронично","relation":"Подруга"}'};function all(n){return [n,...n.children.flatMap(all)]}await all(env.body).find(n=>n.textContent==='Заполнить пустое').onclick();assert.equal(settings.manner,'');assert.equal(sent.responseLength,900);assert.ok(!sent.prompt.includes('separateConversation'));await all(env.body).find(n=>n.textContent==='Применить описание').onclick();assert.equal(settings.ownName,'Слоппи');assert.equal(settings.personality,'Любит кино');assert.equal(settings.manner,'Иронично');assert.equal(settings.relation,'Подруга');}finally{env.cleanup()}});
test('Theme changes and new controls survive reload with the same profile and local PNG',async()=>{const first=setup();let second;try{await first.testAPI.initialize();const s=first.testAPI.get().settings;Object.assign(s,{theme:'sacred',panel:'#f7efdb',ink:'#42331f',accent:'#8a692b',themeNames:false,effects:false,dialogueWidth:540});const png=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'});await first.testAPI.uploadImage('title',png);await first.testAPI.openSettings();const profile=s.companionProfiles.find(p=>p.id===s.activeCompanion);Object.assign(profile.values,{theme:s.theme,panel:s.panel,ink:s.ink,accent:s.accent,themeNames:false,effects:false,dialogueWidth:540});second=setup(s,first.data);await second.testAPI.initialize();const state=second.testAPI.get();assert.equal(state.settings.theme,'sacred');assert.equal(state.settings.dialogueWidth,540);assert.equal(state.settings.effects,false);assert.equal(state.root.querySelector('[data-qtc="startMeeting"]').textContent,'Начать встречу');assert.equal(state.root.querySelector('[data-qtc="titleSprite"]').hidden,false);}finally{first.cleanup();second?.cleanup()}});

test('Unchanged refresh does not recreate history entries or suggested reply buttons',async()=>{const e=setup();try{await e.testAPI.initialize();e.testAPI.get().settings.suggestReplies=true;e.api.generateRaw=async()=>'{"text":"Привет","choices":["Привет!"],"emotion":"happy"}';await e.testAPI.ask({kind:'greet',text:'Привет'});const root=e.testAPI.get().root,history=root.querySelector('[data-qtc="history"]'),choices=root.querySelector('[data-qtc="choices"]');const entry=history.children[0],choice=choices.children[0];for(let i=0;i<20;i++)e.testAPI.render();await e.testAPI.refresh();assert.equal(history.children[0],entry);assert.equal(choices.children[0],choice);}finally{e.cleanup()}});

test('Dialog is compact by default and full-text control toggles without generating messages',async()=>{
 const e=setup();try{
  await e.testAPI.initialize();
  assert.equal(e.testAPI.get().settings.dialogueWidth,520);
  assert.equal(e.testAPI.get().settings.panelSize,'compact');
  const control=e.testAPI.get().root.querySelector('[data-qtc="reveal"]');
  assert.equal(control.textContent,'Развернуть');
  const previous=e.testAPI.get().conversation.memory.length;
  control.click();assert.equal(control.textContent,'Свернуть текст');
  control.click();assert.equal(control.textContent,'Развернуть');
  assert.equal(e.testAPI.get().conversation.memory.length,previous);
 }finally{e.cleanup()}
});

test('Visual upgrade shrinks only the legacy default panel width, keeping custom widths',async()=>{
 for(const [width,expected] of [[660,520],[540,540]]){
  const e=setup({...core.DEFAULTS,dialogueWidth:width});
  try{await e.testAPI.initialize();assert.equal(e.testAPI.get().settings.dialogueWidth,expected)}
  finally{e.cleanup()}
 }
});

test('Truncated relationship JSON renders only the spoken text and does not store metadata',async()=>{
 const e=setup();try{
  await e.testAPI.initialize();
  e.testAPI.get().settings.textSpeed=0;
  e.api.generateRaw=async()=>'{"text":["Привет, Камилла!","Разберёмся с показаниями."],"trustDelta":1,"romanceDelta":0,"tensionDelta":0,"routeNote":"Дружеское приветствие';
  await e.testAPI.ask({kind:'greet',text:'Привет'});
  const root=e.testAPI.get().root;
  const speech=root.querySelector('[data-qtc="speech"]');
  const visible=speech.children.map(x=>x.textContent).join(' ');
  assert.match(visible,/Разберёмся с показаниями/);
  assert.doesNotMatch(visible,/trustDelta|romanceDelta|routeNote/);
  const memory=e.testAPI.get().conversation.memory;
  assert.ok(!memory[1].text.includes('trustDelta'));
 }finally{e.cleanup()}
});

test('Unrecoverable control-only response is an error with retry, not a visible JSON message',async()=>{
 const e=setup();try{
  await e.testAPI.initialize();
  e.api.generateRaw=async()=>'{"emotion":"shy","trustDelta":2';
  await e.testAPI.ask({kind:'greet',text:'Привет'});
  const root=e.testAPI.get().root;
  const status=root.querySelector('[data-qtc="status"]');
  assert.match(status.textContent,/повреждённый формат|без реплики/);
  assert.doesNotMatch(root.querySelector('[data-qtc="speech"]').children.map(x=>x.textContent).join(' '),/trustDelta/);
  assert.equal(root.querySelector('[data-qtc="retry"]').hidden,false);
 }finally{e.cleanup()}
});


test('A prematurely cut off action is retried once without storing the fragment',async()=>{
 const env=setup();try{
  await env.testAPI.initialize();
  env.testAPI.get().settings.textSpeed=0;
  let attempts=0;
  env.api.generateRaw=async request=>{attempts++;assert.match(request.systemPrompt,/No JSON/);return attempts===1?'*Ч':'*Чуть улыбаюсь* Привет, я тебя слушаю.';};
  await env.testAPI.ask({kind:'message',text:'Привет'});
  assert.equal(attempts,2);
  assert.equal(env.testAPI.get().conversation.memory.length,2);
  assert.equal(env.testAPI.get().conversation.memory[1].text,'*Чуть улыбаюсь* Привет, я тебя слушаю.');
  assert.equal(env.testAPI.get().busy,false);
 }finally{env.cleanup()}
});

test('Two broken completions do not change conversation memory',async()=>{
 const env=setup();try{
  await env.testAPI.initialize();
  let attempts=0;env.api.generateRaw=async()=>{attempts++;return '*Ч';};
  await env.testAPI.ask({kind:'message',text:'Ты здесь?'});
  assert.equal(attempts,2);
  assert.equal(env.testAPI.get().conversation.memory.length,0);
  assert.equal(env.testAPI.get().root.querySelector('[data-qtc="retry"]').hidden,false);
  assert.equal(env.testAPI.get().busy,false);
 }finally{env.cleanup()}
});

test('Plain natural dialogue is recorded and care changes trust without numeric model fields',async()=>{
 const env=setup();try{
  await env.testAPI.initialize();
  env.api.generateRaw=async()=>'*Благодарно киваю* Спасибо тебе. Мне правда стало спокойнее.';
  await env.testAPI.ask({kind:'message',text:'Я поддержу тебя, выслушаю и помогу.'});
  assert.equal(env.testAPI.get().conversation.memory[1].text,'*Благодарно киваю* Спасибо тебе. Мне правда стало спокойнее.');
  assert.ok(env.testAPI.get().conversation.relationship.trust>0);
  assert.equal(env.api.chat.length,1);
 }finally{env.cleanup()}
});

test('Natural-language responses select uploaded shy and angry PNGs (no JSON)',async()=>{
 const env=setup();
 try{
  await env.testAPI.initialize();
  const png=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'});
  for(const name of ['shy','angry','neutral'])await env.testAPI.uploadImage(name,png);
  const root=env.testAPI.get().root;
  const sprite=root.querySelector('[data-qtc="sprite"]');
  const idleSrc=sprite.src;
  env.api.generateRaw=async()=>'*Краснеет и отводит взгляд.* Ты меня смущаешь!';
  await env.testAPI.ask({kind:'action',text:'Поцеловать тебя'});
  assert.equal(root.querySelector('[data-qtc="emotion"]').textContent,'Смущение');
  const shySrc=sprite.src;
  assert.notEqual(shySrc,idleSrc);
  env.api.generateRaw=async()=>'*Отдёргивает руку и вскрикивает.* Что ты делаешь?!';
  await env.testAPI.ask({kind:'action',text:'Я откусила ему палец'});
  assert.equal(root.querySelector('[data-qtc="emotion"]').textContent,'Злость');
  assert.notEqual(sprite.src,shySrc);
  assert.equal(env.testAPI.get().conversation.memory.length,4);
 }finally{env.cleanup();}
});

test('When expression PNG is absent, report missing slot instead of pretending neutral is intended',async()=>{
 const env=setup();
 try{
  await env.testAPI.initialize();
  env.api.generateRaw=async()=>'*Отскочил назад.* Ты что творишь?!';
  await env.testAPI.ask({kind:'action',text:'Откусила ему палец'});
  const root=env.testAPI.get().root;
  assert.match(root.querySelector('[data-qtc="emotion"]').textContent,/Злость/);
  assert.match(root.querySelector('[data-qtc="emotion"]').title,/не загружена PNG/);
  assert.match(root.querySelector('[data-qtc="status"]').textContent,/не загружена PNG/);
 }finally{env.cleanup();}
});

test('Model connection check stays inside settings and does not open a blocking chat overlay', async()=>{
 const env=setup();try{
  await env.testAPI.initialize();await env.testAPI.openSettings();
  const state=env.testAPI.get(),titleBefore=state.titleOpen,historyBefore=state.conversation.memory.length;
  const nodes=(n)=>[n,...n.children.flatMap(nodes)];
  nodes(env.body).forEach(n=>n.isConnected=true);const button=nodes(env.body).find(n=>n.textContent==='Проверить ответ модели');assert.ok(button);
  let requests=0;env.api.generateRaw=async()=>{requests++;return 'Привет, всё работает.'};
  await button.onclick();
  assert.equal(requests,1);
  assert.equal(env.testAPI.get().titleOpen,titleBefore);
  assert.equal(env.testAPI.get().conversation.memory.length,historyBefore);
  assert.equal(env.testAPI.get().root.querySelector('[data-qtc="panel"]').hidden,true);
  const status=nodes(env.body).find(n=>String(n.textContent||'').includes('Подключение работает.'));
  assert.ok(status);
 }finally{env.cleanup()}
});

test('Closing a companion dialogue from welcome leaves the fullscreen overlay',async()=>{
 const env=setup();try{
  await env.testAPI.initialize();env.testAPI.startMeeting();await new Promise(r=>setTimeout(r,25));
  const root=env.testAPI.get().root;
  root.querySelector('[data-qtc="close"]').onclick();
  await new Promise(r=>setTimeout(r,210));
  assert.equal(env.testAPI.get().welcome,false);
  assert.equal(root.querySelector('[data-qtc="panel"]').hidden,true);
 }finally{env.cleanup()}
});

test('Floating chat button can be dragged and its relative location survives saving and reload', async()=>{
 const env=setup();let after;try{
  await env.testAPI.initialize();
  const root=env.testAPI.get().root, mini=root.querySelector('[data-qtc="mini"]');
  const callbacks={};mini.addEventListener=(name,fn)=>{callbacks[name]=fn};
  mini.isConnected=true;mini.offsetWidth=100;mini.offsetHeight=54;
  root.getBoundingClientRect=()=>({left:0,top:0,width:390,height:780});
  mini.getBoundingClientRect=()=>({left:Number.parseFloat(mini.style.left)||268,top:Number.parseFloat(mini.style.top)||695,width:100,height:54});
  mini.style.setProperty=(name,value)=>{mini.style[name]=value};
  env.testAPI.setupMiniDragging();
  callbacks.pointerdown({pointerId:3,button:0,clientX:320,clientY:710});
  callbacks.pointermove({pointerId:3,button:0,clientX:130,clientY:340,cancelable:true,preventDefault(){}});
  callbacks.pointerup({pointerId:3,button:0,clientX:130,clientY:340});
  const pos=env.testAPI.get().settings.miniPosition;
  assert.ok(pos.x>=0&&pos.x<=1&&pos.y>=0&&pos.y<=1);
  assert.ok(pos.y<0.6);
  assert.ok(pos.x<0.5);
  after=setup(env.testAPI.get().settings,env.data);await after.testAPI.initialize();
  assert.equal(after.testAPI.get().settings.miniPosition.x,pos.x);
  assert.equal(after.testAPI.get().settings.miniPosition.y,pos.y);
 }finally{env.cleanup();after?.cleanup()}
});


test('HTTP origin without crypto.randomUUID boots and can create a companion profile', async()=>{
 const env=setup(null,null,{crypto:undefined});
 try{
  await env.testAPI.initialize();
  const initial=env.testAPI.get().settings;
  assert.match(initial.storageId,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  await env.testAPI.openSettings();
  const all=n=>[n,...n.children.flatMap(all)];
  const input=all(env.body).find(n=>String(n.placeholder||'').includes('Имя нового профиля'));
  const create=all(env.body).find(n=>n.textContent==='＋ Создать профиль');
  assert.ok(input&&create);
  input.value='Луна';
  await create.onclick();
  assert.equal(env.testAPI.get().settings.companionProfiles.at(-1).name,'Луна');
 }finally{env.cleanup()}
});

test('Restricted UUID API uses getRandomValues and does not prevent startup',async()=>{
 let randomCalls=0;
 const env=setup(null,null,{crypto:{randomUUID(){throw new Error('API unavailable')},getRandomValues(buf){randomCalls++;for(let i=0;i<buf.length;i++)buf[i]=i+1;return buf;}}});
 try{
  await env.testAPI.initialize();
  assert.equal(randomCalls,1);
  assert.match(env.testAPI.get().settings.storageId,/^01020304-0506-4708-890a-0b0c0d0e0f10$/);
 }finally{env.cleanup()}
});

test('Extensions settings toggle hides and restores companion without erasing memory',async()=>{
 const env=setup();try{
  await env.testAPI.initialize();
  const toggle=vm.runInContext('extensionEnabledToggle',env.context);
  assert.ok(toggle);
  assert.equal(toggle.checked,true);
  const previousStore=env.testAPI.get().settings.storageId;
  toggle.checked=false;toggle.onchange();
  assert.equal(env.testAPI.get().settings.enabled,false);
  assert.equal(env.testAPI.get().root.hidden,true);
  toggle.checked=true;toggle.onchange();
  assert.equal(env.testAPI.get().settings.enabled,true);
  assert.equal(env.testAPI.get().root.hidden,false);
  assert.equal(env.testAPI.get().settings.storageId,previousStore);
 }finally{env.cleanup()}
});

