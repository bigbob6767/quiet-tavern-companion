// Pure text parsing: model output is never interpreted as HTML.
export function speechParts(text) {
 return String(text).split(/(\*[^*\n]+\*)/g).filter(Boolean).flatMap(s=>{
  const action=s.startsWith('*')&&s.endsWith('*');
  return (action?[s.slice(1,-1)]:s.split(/\n+/)).filter(s=>s.trim()).map(text=>({text:text.trim(),action}));
 });
}
export function letters(text){return typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter('ru',{granularity:'grapheme'}).segment(text),x=>x.segment):Array.from(text);}
export const PALETTES={fantasy:['Лунное фэнтези','#242133','#f5edf8','#b8a6dc'],pink:['Нежная новелла','#fff0e5','#513842','#a56779'],gothic:['Готика','#23151e','#f8e7ed','#dc9baf'],modern:['Современная драма','#e7eef0','#263640','#67818d'],halloween:['Хэллоуин','#331c41','#fff0dd','#efa969']};
export function icon(kind){const paths={heart:'M12 21 3 12C-3 5 7-1 12 6c5-7 15-1 9 6Z',kiss:'M3 13q5-9 9-4 4-5 9 4-9 12-18 0Zm0 0q9 3 18 0',hand:'M6 13V8a2 2 0 0 1 4 0V4a2 2 0 0 1 4 0v5a2 2 0 0 1 4 0v2a2 2 0 0 1 4 0v5q0 7-8 7-4 0-7-4l-5-5q-1-4 4-1Z',cup:'M4 5h13v10q0 5-6 5t-7-5Zm13 2h3q5 5-3 7M2 23h19',star:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',plus:'M12 4v16M4 12h16'};return `<svg class="qtc-icon" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[kind]||paths.star}"/></svg>`;}
export const FLOURISH='<svg class="qtc-flourish" viewBox="0 0 360 42" fill="none" stroke="currentColor" aria-hidden="true"><path d="M180 4l10 17-10 17-10-17Z M158 21H35q-30 0-24-13t25 0q5 12-12 20m178-7h123q30 0 24-13t-25 0q-5 12 12 20M150 21q-30-25-55-8t-50 8m165 0q30-25 55-8t50 8"/><circle cx="180" cy="21" r="4"/><path d="M65 21q-6 14-18 13m248-13q6 14 18 13"/></svg>';
