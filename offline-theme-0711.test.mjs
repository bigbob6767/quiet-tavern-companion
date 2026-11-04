import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
test('A single offline stylesheet, no obsolete imports, art files or remote fonts',async()=>{
 const css=await readFile(resolve(root,'style.css'),'utf8');
 assert.doesNotMatch(css,/@import|googleapis|https:\/\/fonts/);
 assert.doesNotMatch(css,/data-theme=(?:halloween|modern|fantasy)/);
 assert.doesNotMatch(css,/rose\.svg|art\/(?:halloween|modern|fantasy|gothic)\.svg/);
 assert.match(css,/qtc-ui-ready/);
 const art=await readdir(resolve(root,'art'));
 assert.equal(art.some(n=>/halloween|modern|fantasy|^gothic\.svg$/.test(n)),false);
 for(const theme of ['pink','gothic','retro','xianxia','sacred']){
  for(const prefix of ['frame','crest','wordmark'])assert.ok(art.includes(`${prefix}-${theme}.svg`));
  assert.ok(art.includes(`${theme}-scene.svg`));
 }
});
test('Startup has a hidden themed shell and reveals only after render',async()=>{
 const js=await readFile(resolve(root,'index.js'),'utf8');
 assert.match(js,/root.hidden=true;root.dataset.theme=THEMES/);
 assert.match(js,/renderHistory\(\);root.classList.add\('qtc-ui-ready'\);root.hidden=!show/);
 assert.doesNotMatch(js,/const show=activeVisible\(\);root.hidden=!show;const title=/);
});
