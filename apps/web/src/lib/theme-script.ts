import { BUILTIN_THEMES } from "./themes";
import { STORAGE_KEY } from "./storage-key";

/**
 * Inline script that applies the saved theme (and font) before first paint,
 * so there is no flash of the wrong theme. It runs before React, so it is
 * kept dependency-free and mirrors `colorsToVars`.
 */
export const themeBootScript = `(function(){try{
var T=${JSON.stringify(Object.fromEntries(Object.entries(BUILTIN_THEMES).map(([k, v]) => [k, v.colors])))};
var raw=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
var s=raw?(JSON.parse(raw).state||{}).data:null;s=s&&s.settings;
var legacy={light:'paper',dark:'ink'};
var id=(s&&s.theme)||'classic-dark';id=legacy[id]||id;var r=document.documentElement;
function rgb(h){h=(h||'').replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c}).join('');var n=parseInt(h.slice(0,6),16)||0;return[(n>>16)&255,(n>>8)&255,n&255]}
function mix(a,b,t){return a.map(function(v,i){return Math.round(v+(b[i]-v)*t)}).join(' ')}
var custom=s&&s.customThemes&&s.customThemes.filter(function(x){return x.id===id})[0];
var c=custom?custom.colors:T[id];
if(!c){c=T[window.matchMedia('(prefers-color-scheme: dark)').matches?'classic-dark':'classic-light']}
var b=rgb(c.background),f=rgb(c.foreground);var dark=(0.2126*b[0]+0.7152*b[1]+0.0722*b[2])/255<0.5;
var vars={bg:b.join(' '),fg:f.join(' '),muted:rgb(c.muted).join(' '),accent:rgb(c.accent).join(' '),error:rgb(c.error).join(' '),surface:mix(b,f,0.05),line:mix(b,f,0.13)};
for(var k in vars)r.style.setProperty('--'+k,vars[k]);r.style.colorScheme=dark?'dark':'light';r.dataset.theme=id;r.dataset.dark=String(dark);
}catch(e){}})();`;
