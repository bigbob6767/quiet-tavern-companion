import test from 'node:test';
import assert from 'node:assert/strict';
import {isBrokenCompletion,inferRelationshipDelta} from '../route-engine.mjs';

test('Rejects obviously incomplete actions without rejecting a short answer',()=>{
 assert.ok(isBrokenCompletion('*Ч'));
 assert.ok(isBrokenCompletion('*Неловко улыбаюсь'));
 assert.equal(isBrokenCompletion('Да.'),false);
 assert.equal(isBrokenCompletion('*Улыбнулась*'),false);
});
test('A refused proposal never creates a relationship even at high scores',()=>{
 const route={trust:95,romance:95,tension:0};
 const event={kind:'message',text:'Давай встречаться'};
 const update=inferRelationshipDelta(event,{text:'Нет, я не готова.'},route);
 assert.equal(update.rejectedProposal,true);
 assert.equal(update.dating,undefined);
});
test('Mutual acceptance can begin dating only with trust and compatibility',()=>{
 const event={kind:'message',text:'Давай встречаться'};
 assert.equal(inferRelationshipDelta(event,{text:'Да, я согласна.'},{trust:10,romance:10}).dating,undefined);
 assert.equal(inferRelationshipDelta(event,{text:'Да, я согласна.'},{trust:80,romance:80}).dating,true);
});
test('Care can improve trust, insults worsen, repeated actions do not farm points',()=>{
 assert.equal(inferRelationshipDelta({kind:'message',text:'Спасибо'},{text:'Рада помочь'},{}).trustDelta,1);
 assert.deepEqual(inferRelationshipDelta({kind:'message',text:'Заткнись, дура'},{text:'Неприятно'},{}),{trustDelta:-2,tensionDelta:2});
 const recent=[{role:'user',text:'Спасибо'},{role:'user',text:'Спасибо'}];
 assert.deepEqual(inferRelationshipDelta({kind:'message',text:'Спасибо'},{text:'Спасибо'}, {},recent),{});
});

test('Physically injuring the companion harms trust and increases tension',()=>{const result=inferRelationshipDelta({kind:'action',text:'Откусила ему палец'},{text:'Что ты творишь?!'},{trust:30,romance:20},[]);assert.equal(result.trustDelta,-3);assert.equal(result.tensionDelta,3);assert.equal(result.romanceDelta,-1);});
