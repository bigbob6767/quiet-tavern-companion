import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const dir=resolve(dirname(fileURLToPath(import.meta.url)),'..');
test('Five complete ornamental frame and crest SVG files are local and loadable',async()=>{
 for(const theme of ['pink','gothic','retro','xianxia','sacred']){
  const frame=await readFile(resolve(dir,`art/frame-${theme}.svg`),'utf8');
  const crest=await readFile(resolve(dir,`art/crest-${theme}.svg`),'utf8');
  assert.match(frame,/viewBox="0 0 1200 560"/);
  assert.match(crest,/viewBox="0 0 320 154"/);
  assert.match(frame,/path/);
  assert.match(crest,/path/);
 }
});
test('Decoration is real DOM and final stylesheet overrides the old hidden crown and economy rules',async()=>{
 const js=await readFile(resolve(dir,'index.js'),'utf8');
 const root=await readFile(resolve(dir,'style.css'),'utf8');
 const css=await readFile(resolve(dir,'ornate.css'),'utf8');
 assert.match(js,/class="qtc-frame-art"/);
 assert.match(js,/class="qtc-crest-art"/);
 assert.match(root,/ornate\.css\?v=074/);
 assert.ok(root.lastIndexOf('ornate.css')>root.lastIndexOf('novella.css'));
 assert.match(css,/qtc-economy \.qtc-frame-art/);
 assert.match(css,/@media\(max-width:359px\)/);
});
