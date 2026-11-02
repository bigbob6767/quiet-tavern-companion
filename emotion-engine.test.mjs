import test from 'node:test';
import assert from 'node:assert/strict';
import {inferEmotion} from '../emotion-engine.mjs';

const action=(text)=>({kind:'action',text});
const reply=(text,emotion='neutral')=>({text,emotion});

test('Plain replies change expressions for a kiss and a finger injury',()=>{
 assert.equal(inferEmotion(action('Поцеловать тебя в щёку'),reply('*Краснеет, отводит взгляд.* Ты меня смущаешь...')),'shy');
 assert.equal(inferEmotion(action('Откусила ему палец'),reply('*Резко отдёргивает руку.* Ты что творишь?!')),'angry');
 assert.equal(inferEmotion({kind:'message',text:'Я откусила тебе палец'},reply('Не делай так больше!')),'angry');
 assert.equal(inferEmotion(action('Ударить тебя'),reply('*Вздрогнул, испугался и заплакал.* Мне больно.')),'sad');
});

test('Character-specific reactions beat simple action guesses',()=>{
 assert.equal(inferEmotion(action('Поцеловать тебя в щёку'),reply('Не смей так делать! Прекрати!')),'angry');
 assert.equal(inferEmotion(action('Поцеловать тебя в щёку'),reply('Смотрю спокойно и невозмутимо.')),'neutral');
 assert.equal(inferEmotion(action('Поцеловать тебя'),reply('Радостно улыбаюсь.'),{trust:90,romance:90}),'happy');
 assert.equal(inferEmotion(action('Поддразнить тебя'),reply('*Подмигивает* Вот хитрец!')),'playful');
});

test('Legacy structured emotion wins and unrelated conversations remain calm',()=>{
 assert.equal(inferEmotion(action('Поцеловать тебя'),reply('Я немного улыбаюсь.','playful')),'playful');
 assert.equal(inferEmotion({kind:'comment',text:'Что думаешь?'},reply('Нужно обдумать это подробнее.')),'neutral');
 assert.equal(inferEmotion({kind:'touch',text:'Касание руки'},reply('Я слегка поворачиваюсь.')),'neutral');
 assert.equal(inferEmotion(action('Передать книгу'),reply('Спасибо.')),'neutral');
});
