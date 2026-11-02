import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const themes=['pink','gothic','retro','xianxia','sacred'];
test('Each theme provides offline vector wordmark with Cyrillic outlines',async()=>{
 for(const theme of themes){
  const svg=await readFile(resolve(root,`art/wordmark-${theme}.svg`),'utf8');
  assert.match(svg,/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/<path [^>]*d="/);
  assert.ok(svg.length>2000);
 }
});
test('Settings and title menus have themed art in final stylesheet, with mobile rules',async()=>{
 const style=await readFile(resolve(root,'style.css'),'utf8');
 const css=await readFile(resolve(root,'interface-076.css'),'utf8');
 const js=await readFile(resolve(root,'index.js'),'utf8');
 assert.ok(style.lastIndexOf('interface-076.css')>style.lastIndexOf('ornate.css'));
 assert.match(css,/#qtc-settings\[data-theme\]::after/);
 assert.match(css,/#quiet-tavern-companion\[data-theme\] \.qtc-title-menu::after/);
 assert.match(css,/@media\(max-width:760px\)/);
 for(const theme of themes)assert.match(css,new RegExp(`wordmark-${theme}\\.svg`));
 assert.match(js,/className='qtc-settings-wordmark'/);
 assert.match(js,/data-qtc="titleWordmark"/);
 assert.match(js,/root\.dataset\.themeNames/);
});
