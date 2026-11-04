import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');
const [js,css,core,profiles,man]=await Promise.all(['index.js','style.css','core.mjs','profiles.mjs','manifest.json'].map(read));
const m=JSON.parse(man);
test('0.7.19 defaults to centered desktop visual novel, allows opting back to side',()=>{
 assert.equal(m.version,'0.7.21');
 assert.match(core,/dialogueWidth:520,desktopLayout:'center'/);
 assert.match(js,/Расположение сцены на ПК/);
 assert.match(js,/Сбоку — поверх чата/);
 assert.match(js,/root.dataset.desktopLayout=settings.desktopLayout==='side'\?'side':'center'/);
 assert.match(profiles,/PROFILE_FIELDS=Object.keys\(DEFAULTS\)/);
});
test('sprite zoom is independent of figure overflow and cannot paint beyond figure area',()=>{
 assert.match(js,/--qtc-sprite-scale/);
 assert.match(css,/data-desktop-layout=center[\s\S]*?\.qtc-figure \{[\s\S]*?overflow:hidden!important;[\s\S]*?contain:paint!important;/);
 assert.match(css,/transform:translateX\(-50%\) scale\(var\(--qtc-sprite-scale,1\)\)!important/);
});
test('centered desktop scene only applies to open conversations, does not change mobile and keeps leave button',()=>{
 assert.match(css,/@media \(min-width:761px\) and \(min-height:530px\)/);
 assert.match(css,/\.qtc-open:not\(\.qtc-title-mode\):not\(\.qtc-compact\) \.qtc-shell/);
 assert.match(css,/width:min\(900px,calc\(100vw - 50px\)\)!important/);
 assert.match(js,/\$\('panelLeave'\)\.onclick=leave/);
});
