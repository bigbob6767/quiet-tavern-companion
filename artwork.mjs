// Resolve local artwork from the extension MODULE, not the SillyTavern document.
// Some host builds inject a CSS stylesheet as a <style> block, where relative
// url('./art/...') resolves against the HOST page instead of our style.css.
export const ART_THEMES = Object.freeze(['pink','gothic','retro','xianxia','sacred']);
export const ART_KINDS = Object.freeze(['scene','frame','crest','wordmark']);

export function artURL(kind, theme, moduleURL = import.meta.url) {
  if (!ART_THEMES.includes(theme) || !ART_KINDS.includes(kind)) {
    throw new TypeError('Unknown artwork: ' + kind + '/' + theme);
  }
  const filename = kind === 'scene' ? `${theme}-scene.svg` : `${kind}-${theme}.svg`;
  return new URL(`./art/${filename}`, moduleURL).href;
}

export function cssArtURL(kind, theme, moduleURL = import.meta.url) {
  return `url("${artURL(kind, theme, moduleURL)}")`;
}

export function applyThemeArtwork(element, theme) {
  if (!element || !ART_THEMES.includes(theme)) return;
  for (const [kind, properties] of [
    ['scene',['--qtc-scene']],
    ['frame',['--qtc-frame','--qtc-ui-frame']],
    ['crest',['--qtc-crest','--qtc-ui-crest']],
    ['wordmark',['--qtc-wordmark']],
  ]) {
    const url = cssArtURL(kind, theme);
    for (const property of properties) element.style.setProperty(property, url);
  }
}
