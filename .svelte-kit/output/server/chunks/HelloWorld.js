import { G as bind_props } from "./index.js";
/* empty css                                                */
import { e as escape_html } from "./escaping.js";
import { j as fallback } from "./utils2.js";
function HelloWorld($$payload, $$props) {
  let name = fallback($$props["name"], "World");
  $$payload.out.push(`<h1 class="svelte-9de6e">Hello ${escape_html(name)}!</h1>`);
  bind_props($$props, { name });
}
export {
  HelloWorld as H
};
