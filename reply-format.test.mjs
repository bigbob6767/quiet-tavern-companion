import test from 'node:test';
import assert from 'node:assert/strict';
import { recoverModelReply, safeDisplayReply } from '../reply-format.mjs';
import { normalizeReply, DEFAULTS, buildPrompt } from '../core.mjs';

const noInternalFields = value => {
 assert.ok(!/"(?:trustDelta|romanceDelta|tensionDelta|routeNote|emotion|choices)"\s*:/.test(value), 'no metadata in the visible text');
};

test('Screenshot regression: array-valued text plus relationship fields',()=>{
 const raw = '{"text":["О, Камилла, явилась наконец!", "Надо разобраться в этой путанице с показаниями."],"trustDelta":1,"romanceDelta":0,"tensionDelta":0,"routeNote":"Дружеское приветствие"}';
 const reply = normalizeReply(raw);
 assert.equal(reply.text,'О, Камилла, явилась наконец!\nНадо разобраться в этой путанице с показаниями.');
 assert.equal(reply.trustDelta,1);
 noInternalFields(reply.text);
});

test('Screenshot regression: truncated JSON with array text and metadata remains readable',()=>{
 const raw = '{"text":["О, Камилла, явилась наконец!","Надо разобраться в этой путанице с показаниями."],"trustDelta":1,"romanceDelta":0,"tensionDelta":0,"routeNote":"Дружеское приветствие';
 const reply=normalizeReply(raw);
 assert.match(reply.text,/разобраться в этой путанице/);
 noInternalFields(reply.text);
 assert.equal(reply.emotion,'neutral');
});

test('Truncated object with text as string discards all relationship metadata',()=>{
 const raw = '{"text":"Привет, я здесь!","trustDelta":1,"romanceDelta":0,"tensionDelta":0,"routeNote":"Дружеский';
 const reply=normalizeReply(raw);
 assert.equal(reply.text,'Привет, я здесь!');
 assert.equal(reply.trustDelta,undefined);
 noInternalFields(reply.text);
});

test('Malformed JSON with unescaped quoted dialogue does not reveal metadata',()=>{
 const raw = '{"text":"Она сказала "я рада", хотя всё ещё смущалась.","emotion":"shy","trustDelta":1';
 assert.equal(normalizeReply(raw).text,'Она сказала "я рада", хотя всё ещё смущалась.');
});

test('Older incorrectly stored content is cleaned before display',()=>{
 const old='Надо разобраться в этой путанице с показаниями."], "trustDelta":1,"romanceDelta":0,"tensionDelta":0,"routeNote":"Дружеское приветствие"';
 assert.equal(safeDisplayReply(old),'Надо разобраться в этой путанице с показаниями.');
});

test('Malformed JSON without recoverable text shows an error and never leaks fields',()=>{
 assert.throws(()=>normalizeReply('{"emotion":"happy","trustDelta":2'),/повреждённый формат|без реплики/);
 assert.equal(safeDisplayReply('{"emotion":"happy","trustDelta":2'),'Ответ модели был повреждён. Нажми «Повторить», чтобы получить реплику заново.');
});

test('Ordinary messages and bracket narration stay untouched',()=>{
 assert.equal(normalizeReply('Привет, как дела?').text,'Привет, как дела?');
 assert.equal(normalizeReply('[улыбаюсь] Привет!').text,'[улыбаюсь] Привет!');
 assert.deepEqual(normalizeReply('{"text":"Тихо","emotion":"shy"}'),{text:'Тихо',emotion:'shy'});
});

test('A fenced wrapped JSON reply can be decoded',()=>{
 const r=normalizeReply('```json\n[{"text":"Я тебе верю","emotion":"shy","trustDelta":2}]\n```');
 assert.equal(r.text,'Я тебе верю');
 assert.equal(r.trustDelta,2);
});

test('Prompt requests plain text and no structured reply',()=>{
 const p=buildPrompt({settings:DEFAULTS,identity:{name:'Саюри'},event:{kind:'greet',text:'Привет'}});
 assert.match(p.system,/Return ONLY the character's complete natural-language speech/);
});

test('Old leaked metadata in saved assistant history does not reach the next prompt',()=>{
 const old='Можем поговорить позже."],"trustDelta":1,"romanceDelta":0,"routeNote":"хорошее знакомство"';
 const prompt=buildPrompt({settings:DEFAULTS,identity:{name:'Луна'},memory:[{role:'assistant',kind:'reply',text:old}],event:{kind:'message',text:'Привет'}});
 const remembered=JSON.parse(prompt.prompt).separateConversation[0].text;
 assert.equal(remembered,'Можем поговорить позже.');
});

test('Repeated malformed JSON is parsed consistently and plain dialogue is not overfiltered',()=>{
 for(let i=0;i<8;i++){
  const raw='Some prefix: {"text":"Привет","trustDelta":1';
  assert.equal(normalizeReply(raw).text,'Привет');
  assert.equal(normalizeReply('Обычная реплика с {вздохом} и [действием]').text,'Обычная реплика с {вздохом} и [действием]');
 }
});


test('Plain-text response does not need JSON fields and old incomplete memories are hidden',()=>{
 const prompt=buildPrompt({settings:DEFAULTS,identity:{name:'Саюри'},event:{kind:'message',text:'Привет'}});
 assert.match(prompt.system,/No JSON/);
 assert.doesNotMatch(prompt.system,/Return exactly one valid JSON object/);
 assert.equal(normalizeReply('*Улыбнулась* Я рада тебя видеть.').text,'*Улыбнулась* Я рада тебя видеть.');
 assert.equal(safeDisplayReply('*Ч'),'Предыдущая реплика была оборвана.');
});

test('Plain-language user suggestions are separated from speech without JSON',()=>{
 const reply=normalizeReply('Может, прогуляемся?\n→ Пойдём!\n→ Не сегодня');
 assert.equal(reply.text,'Может, прогуляемся?');
 assert.deepEqual(reply.choices,['Пойдём!','Не сегодня']);
});
