import { w as slot } from "../../chunks/index.js";
function _layout($$payload, $$props) {
  $$payload.out.push(`<div class="app svelte-mj0h7c"><header class="svelte-mj0h7c"><nav class="svelte-mj0h7c"><a href="/" class="svelte-mj0h7c">Home</a> <a href="/components" class="svelte-mj0h7c">Components</a> <div class="nav-section svelte-mj0h7c"><span class="nav-label svelte-mj0h7c">Demos:</span> <a href="/fel" class="svelte-mj0h7c">FEL</a> <a href="/meme" class="svelte-mj0h7c">MEME</a> <a href="/absrel" class="svelte-mj0h7c">aBSREL</a> <a href="/busted" class="svelte-mj0h7c">BUSTED</a> <a href="/relax" class="svelte-mj0h7c">RELAX</a> <a href="/slac" class="svelte-mj0h7c">SLAC</a> <a href="/bgm" class="svelte-mj0h7c">BGM</a> <a href="/fade" class="svelte-mj0h7c">FADE</a> <a href="/gard" class="svelte-mj0h7c">GARD</a></div></nav> <h1 class="svelte-mj0h7c">HyPhy Scope</h1> <p>Component Library &amp; Demo</p></header> <main class="svelte-mj0h7c"><!---->`);
  slot($$payload, $$props, "default", {});
  $$payload.out.push(`<!----></main> <footer class="svelte-mj0h7c"><p>Built with SvelteKit</p></footer></div>`);
}
export {
  _layout as default
};
