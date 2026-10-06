import { THEME_COLORS } from './theme-colors';

/**
 * Blocking snippet for each app's `index.html`, placed in `<head>` **before**
 * the stylesheet link.
 *
 * Without it the page paints light, then React mounts and flips it to dark —
 * a visible flash on every load, worst on a slow mobile connection where the
 * bundle takes seconds to arrive. It duplicates a few lines of `theme-context`
 * on purpose: it must run before any module loads, so it cannot import them.
 *
 * The colours are interpolated from `THEME_COLORS` so this isn't another copy to
 * keep in sync. `THEME_STORAGE_KEY` still is one — it has to be a literal here.
 */
export const themeInitScript = `(function(){try{
var m=localStorage.getItem('qotm-web-theme');
var d=m==='dark'||((m===null||m==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);
var r=document.documentElement;
r.classList.toggle('dark',d);
r.style.colorScheme=d?'dark':'light';
var t=document.querySelector('meta[name="theme-color"]');
if(t)t.setAttribute('content',d?'${THEME_COLORS.dark}':'${THEME_COLORS.light}');
}catch(e){}})();`;
