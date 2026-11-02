export const THEMES={
 pink:{name:'Сакура · Лепестки весны',short:'Сакура',description:'Весенний коридор школы, мягкий свет и лепестки сакуры',panel:'#fff6f8',ink:'#4e2b3c',accent:'#b34776',title:'Лепестки весны',subtitle:'Сакура · после уроков',font:'Georgia',labels:['Встретиться после уроков','Вернуться в чат','Школьный альбом','Дневник встреч','Галерея'],effect:'petals'},
 gothic:{name:'Бархатная готика · Полуночный вальс',short:'Бархатная готика',description:'Полночный особняк, витражи, луна и старое золото',panel:'#2b1421',ink:'#f9eada',accent:'#ceaa77',title:'Полуночный вальс',subtitle:'Бархатная готика · истории при свечах',font:'Georgia',labels:['Открыть главу','Вернуться в чат','Герои ночи','Хроники','Портреты'],effect:'embers'},
 retro:{name:'Русские 90-е · Кассетное лето',short:'Русские 90-е',description:'Панельные дома, гаражи, кассеты и дождливый вечер',panel:'#efe4cc',ink:'#283a3b',accent:'#80583b',title:'Кассетное лето',subtitle:'Наш двор · девяносто какой-то год',font:'Courier New',labels:['Выйти во двор','Вернуться в чат','Своя компания','Записки','Фотоальбом'],effect:'rain'},
 xianxia:{name:'Китайское фэнтези · Нити судьбы',short:'Китайское фэнтези',description:'Горные пики в тумане, павильон и бумажные фонари',panel:'#f7f0e1',ink:'#294b47',accent:'#9d4334',title:'Нити судьбы',subtitle:'Облачный путь · горы и древние клятвы',font:'Georgia',labels:['Начать путь','Вернуться в чат','Спутники','Свитки памяти','Галерея'],effect:'lanterns'},
 sacred:{name:'Тихая обитель · Золотой час',short:'Тихая обитель',description:'Высокие своды, свечи, тёплые лучи сквозь витражи',panel:'#f7f0df',ink:'#493825',accent:'#8d682f',title:'Золотой час',subtitle:'Тихая обитель · свет сквозь витражи',font:'Georgia',labels:['Зажечь свечу','Вернуться в чат','Собеседники','Летопись','Витражи памяти'],effect:'dust'}
};
export const THEME_PALETTES=Object.fromEntries(Object.entries(THEMES).map(([k,t])=>[k,[t.name,t.panel,t.ink,t.accent]]));
export function themeOf(key){return THEMES[key]||THEMES.pink;}
export const PLAIN_LABELS=['Начать встречу','Перейти в таверну','Компаньоны','Воспоминания','Галерея эмоций'];
export function migrateThemes(settings){
 if(settings.themeEdition===7)return;
 const legacyMap={fantasy:'gothic',modern:'retro',halloween:'gothic'};
 const previousPresets={
  pink:['#fff0e5','#fff4f8','#503243'],gothic:['#23151e','#32101c'],
  retro:['#e6ddc6','#e7eef0'],xianxia:['#f5efdf'],sacred:['#f7efdb']
 };
 for(const profile of settings.companionProfiles||[]){
  const v=profile.values||{};
  const original=v.theme,next=THEMES[original]?original:(legacyMap[original]||'pink');
  const known=[...(previousPresets[next]||[]),...({fantasy:['#242133'],modern:['#e7eef0'],halloween:['#331c41']}[original]||[])];
  const preset=!v.panel||known.some(color=>color.toLowerCase()===String(v.panel).toLowerCase());
  v.theme=next;
  if(preset){
   v.panel=THEMES[next].panel;
   const defaultInk={pink:['#54273d','#513842'],gothic:['#fff0de','#f8e7ed'],retro:['#24383a','#263640'],xianxia:['#264b49'],sacred:['#42331f']}[next];
   const defaultAccent={pink:['#c1487a','#a56779'],gothic:['#d4ad75','#dc9baf'],retro:['#70513b','#67818d'],xianxia:['#9d3d32'],sacred:['#8a692b']}[next];
   if(!v.ink||defaultInk.includes(v.ink.toLowerCase()))v.ink=THEMES[next].ink;
   if(!v.accent||defaultAccent.includes(v.accent.toLowerCase()))v.accent=THEMES[next].accent;
  }
 }
 settings.themeEdition=7;
}
export const ACTION_WORDS={
 plain:[['Угостить','Угостить тебя печеньем'],['Обнять','Обнять тебя'],['Поддразнить','Игриво подразнить тебя'],['Поцеловать','Нежно поцеловать тебя в щёку'],['Погладить','Погладить тебя по голове']],
 pink:[['Угостить сладким','Угостить тебя сладостями'],['Обнимашки','Обнять тебя'],['Подколоть','Игриво подразнить тебя'],['Чмокнуть','Нежно поцеловать тебя в щёку'],['Погладить','Погладить тебя по голове']],
 gothic:[['Предложить чай','Предложить тебе чашку чая'],['Заключить в объятия','Обнять тебя'],['Дразнить','Игриво подразнить тебя'],['Подарить поцелуй','Нежно поцеловать тебя в щёку'],['Коснуться волос','Погладить тебя по голове']],
 retro:[['Угостить чаем','Угостить тебя чаем'],['Обнять','Обнять тебя'],['Подколоть','Игриво подразнить тебя'],['Чмокнуть в щёку','Нежно поцеловать тебя в щёку'],['Взъерошить волосы','Легко взъерошить тебе волосы']],
 xianxia:[['Подать чай','Подать тебе чашку чая'],['Обнять','Обнять тебя'],['Поддразнить','Игриво подразнить тебя'],['Поцеловать в щёку','Нежно поцеловать тебя в щёку'],['Погладить волосы','Погладить тебя по голове']],
 sacred:[['Разделить трапезу','Предложить тебе разделить со мной еду'],['Обнять','Обнять тебя'],['Добро пошутить','Доброжелательно подшутить над тобой'],['Поцеловать в щёку','Нежно поцеловать тебя в щёку'],['Погладить','Погладить тебя по голове']]
};
