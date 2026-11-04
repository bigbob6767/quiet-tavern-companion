import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../style.css',import.meta.url),'utf8');
const js=await readFile(new URL('../index.js',import.meta.url),'utf8');
const manifest=JSON.parse(await readFile(new URL('../manifest.json',import.meta.url),'utf8'));
test('0.7.20 never draws themed wallpaper over an open dialogue',()=>{
 assert.equal(manifest.version,'0.7.22');
 assert.doesNotMatch(css,/linear-gradient\(90deg,rgba\(12,12,20,\.50\)/);
 assert.match(css,/#quiet-tavern-companion\[data-theme\]\.qtc-open:not\(\.qtc-title-mode\)::before \{\s*content:none!important;/);
 assert.match(css,/\.qtc-open:not\(\.qtc-title-mode\) \.qtc-welcome-shade \{\s*display:none!important;/);
});
test('title menu backgrounds stay intact, field describes actual purpose',()=>{
 assert.match(css,/\.qtc-title-screen\{\s*background-image:.*var\(--qtc-scene\)/);
 assert.match(js,/Фон стартового меню/);
});
test('the portrait remains safely clipped while panel can be centered',()=>{
 assert.match(css,/data-desktop-layout=center[\s\S]*?\.qtc-figure \{[\s\S]*?overflow:hidden!important;/);
 assert.match(css,/transform:translateX\(-50%\) scale\(var\(--qtc-sprite-scale,1\)\)!important/);
});
