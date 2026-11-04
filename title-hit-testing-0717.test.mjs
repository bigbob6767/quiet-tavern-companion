import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../style.css',import.meta.url),'utf8');
const js=await readFile(new URL('../index.js',import.meta.url),'utf8');
const manifest=JSON.parse(await readFile(new URL('../manifest.json',import.meta.url),'utf8'));

test('0.7.17 title buttons keep pointer events even with oversized portraits',()=>{
 assert.match(manifest.version,/^0\.7\.(?:1[7-9]|[2-9]\d)$/);
 assert.match(css,/\.qtc-title-mode \.qtc-title-screen \{[\s\S]*?z-index:30!important;[\s\S]*?pointer-events:none!important;/);
 assert.match(css,/\.qtc-title-mode \.qtc-title-menu nav button \{\s*pointer-events:auto!important;/);
 assert.match(css,/\.qtc-title-mode \.qtc-figure img \{\s*pointer-events:none!important;/);
 assert.match(js,/\$\('enterTavern'\)\.onclick=leave/);
});
test('meeting toolbar remains clickable without changing sprite size or behavior',()=>{
 assert.match(css,/#quiet-tavern-companion \.qtc-toolbar \{display:none!important;pointer-events:none!important;\}/);
 assert.doesNotMatch(js, /class="qtc-toolbar"/);
 assert.match(js,/root\.style\.setProperty\('--qtc-figure',settings\.size\+'%'\)/);
});
