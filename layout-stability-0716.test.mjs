import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const js=await readFile(new URL('index.js',root),'utf8');
const css=await readFile(new URL('style.css',root),'utf8');
const manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));

test('0.7.16 publishes native text instead of fixed-size SVG label images',async()=>{
  assert.match(manifest.version,/^0\.7\.(?:1[7-9]|[2-9]\d)$/);
  assert.doesNotMatch(js,/vector-lettering|decorateLabel|decorateThemeCard|decoratePrimaryLabels/);
  assert.doesNotMatch(css,/\.qtc-decorative-lettering|\.qtc-lettering-fallback|\.qtc-vector-ready/);
  await assert.rejects(stat(new URL('art/lettering/',root)),/ENOENT/);
});

test('name and badges are separate grid rows; close button is a dedicated column',()=>{
  assert.match(js,/class="qtc-heading"[^>]*>\s*<strong data-qtc="name"><\/strong><div class="qtc-heading-meta">/);
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) 42px!important/);
  assert.match(css,/\.qtc-heading>strong[\s\S]*?position:static!important/);
  assert.match(css,/\.qtc-heading>button\[data-qtc=close\][\s\S]*?grid-column:2!important/);
});

test('reply input stays pinned, independently of actions accordion or scrolling',()=>{
  assert.match(js,/class="qtc-reply qtc-compose"/);
  const start=js.indexOf('root.innerHTML=`');
  const end=js.indexOf('`;document.body.append(root)',start);
  const markup=js.slice(start,end);
  assert.ok(markup.indexOf('class="qtc-tools"')<markup.indexOf('class="qtc-compose"') || markup.indexOf('class="qtc-tools"')<markup.indexOf('class="qtc-reply qtc-compose"'));
  assert.ok(markup.indexOf('data-qtc="replyForm"')>markup.indexOf('data-qtc="cancel"') || /data-qtc="cancel"[^<]*<\/button><\/div><form data-qtc="replyForm"/.test(markup));
  assert.match(css,/\.qtc-compose\s*\{[\s\S]*?flex:0 0 auto!important/);
});

test('relationship detail starts collapsed and settings always keeps real heading visible',()=>{
  assert.match(js,/<details data-qtc="routeCard"/);
  assert.doesNotMatch(js,/<details data-qtc="routeCard"[^>]*\sopen/);
  assert.match(css,/#qtc-settings\[data-theme\] \.qtc-settings-wordmark \{display:none!important\}/);
  assert.match(css,/#qtc-settings\[data-theme\] \.qtc-settings-brand h2[\s\S]*?clip-path:none!important/);
});
