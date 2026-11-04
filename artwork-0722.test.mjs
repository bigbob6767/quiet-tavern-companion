import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {ART_THEMES,ART_KINDS,artURL,cssArtURL,applyThemeArtwork} from '../artwork.mjs';

test('all five themes ship the real scene, crest, frame and wordmark assets',async()=>{
  for(const theme of ART_THEMES) for(const kind of ART_KINDS){
    const url=artURL(kind,theme);
    assert.ok(url.endsWith(`/art/${kind === 'scene' ? theme+'-scene' : kind+'-'+theme}.svg`));
    await access(fileURLToPath(url));
    const svg=await readFile(fileURLToPath(url),'utf8');
    assert.match(svg,/<svg\b/);
    assert.match(svg,/<\/svg>/);
  }
});

test('artwork URL resolves relative to the JS module, never the injected CSS document',()=>{
  const module='https://tavern.test/scripts/extensions/third-party/quiet-tavern-companion/artwork.mjs';
  const path=artURL('scene','pink',module);
  assert.equal(path,'https://tavern.test/scripts/extensions/third-party/quiet-tavern-companion/art/pink-scene.svg');
  assert.equal(cssArtURL('scene','pink',module),`url("${path}")`);
  assert.throws(()=>artURL('scene','../../other'),TypeError);
});

test('scene, frame, crest and name art are assigned as full URL CSS vars',()=>{
  const props=new Map();
  const el={style:{setProperty(k,v){props.set(k,v)}}};
  applyThemeArtwork(el,'gothic');
  for(const [key,resource] of [['--qtc-scene','scene'],['--qtc-frame','frame'],['--qtc-ui-frame','frame'],['--qtc-crest','crest'],['--qtc-ui-crest','crest'],['--qtc-wordmark','wordmark']]){
    assert.equal(props.get(key),cssArtURL(resource,'gothic'));
  }
});

test('settings renders actual image with JS module url, not a CSS-only span',async()=>{
 const js=await readFile(new URL('../index.js',import.meta.url),'utf8');
 const css=await readFile(new URL('../style.css',import.meta.url),'utf8');
 assert.match(js,/document\.createElement\('img'\);scene\.className='qtc-theme-card-art'/);
 assert.match(js,/scene\.src=artURL\('scene',key\)/);
 assert.match(js,/applyThemeArtwork\(root,settings\.theme\)/);
 assert.match(js,/applyThemeArtwork\(dialog,settings\.theme\)/);
 assert.match(css,/border-image-source:var\(--qtc-card-frame,none\)!important/);
});
