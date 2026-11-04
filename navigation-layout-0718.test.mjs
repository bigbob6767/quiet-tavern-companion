import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const js=await readFile(new URL('../index.js',import.meta.url),'utf8');
const css=await readFile(new URL('../style.css',import.meta.url),'utf8');
const manifest=JSON.parse(await readFile(new URL('../manifest.json',import.meta.url),'utf8'));

test('0.7.21 removes the redundant floating navigation dock',()=>{
 assert.equal(manifest.version,'0.7.22');
 assert.doesNotMatch(js,/class="qtc-toolbar"/);
 assert.match(css,/#quiet-tavern-companion \.qtc-toolbar \{display:none!important;pointer-events:none!important;\}/);
});
test('meeting places a direct tavern exit within the dialogue controls',()=>{
 assert.match(js,/data-qtc="panelLeave"[^>]*>↩ В таверну<\/button>/);
 assert.match(js,/\$\('panelLeave'\)\.onclick=leave/);
 assert.doesNotMatch(js, /data-qtc="leave"/);
});
test('the portrait scaling and previous title controls remain intact',()=>{
 assert.match(js,/root\.style\.setProperty\('--qtc-figure',settings\.size\+'%'\)/);
 assert.match(js,/\$\('enterTavern'\)\.onclick=leave/);
 assert.match(css,/\.qtc-title-mode \.qtc-figure img \{\s*pointer-events:none!important;/);
});
