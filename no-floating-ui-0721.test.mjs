import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const js=await readFile(new URL('../index.js',import.meta.url),'utf8');
const css=await readFile(new URL('../style.css',import.meta.url),'utf8');
test('welcome artwork is only painted in titleScreen, never by floating shade',()=>{
 assert.doesNotMatch(js,/class="qtc-welcome-shade"/);
 assert.match(css,/#quiet-tavern-companion\.qtc-welcome \.qtc-welcome-shade,[\s\S]*?background-image:none!important;/);
 assert.match(js,/class="qtc-title-screen"/);
});
test('redundant Settings/Collapse toolbar completely removed from DOM',()=>{
 assert.doesNotMatch(js,/class="qtc-toolbar"/);
 assert.doesNotMatch(js,/data-qtc="leave"/);
 assert.doesNotMatch(js,/data-qtc="context"/);
 assert.match(js,/data-qtc="panelSettings"/);
 assert.match(js,/data-qtc="panelLeave"/);
 assert.match(js,/data-qtc="mini"/);
 assert.match(js,/const compact=!title&&!panelOpen;/);
 assert.match(js,/\$\('mini'\)\.onclick=/);
});
test('host chat background transparent even when panel is collapsed',()=>{
 assert.match(css,/#quiet-tavern-companion\[data-theme\]:not\(\.qtc-title-mode\),[\s\S]*?background:transparent!important;/);
 assert.match(css,/#quiet-tavern-companion:not\(\.qtc-open\) \.qtc-footer\{display:none!important;\}/);
});
