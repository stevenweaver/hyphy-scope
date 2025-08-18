

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.CF04oZYB.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/D_-aaKZl.js","_app/immutable/chunks/DFDNEQV0.js"];
export const stylesheets = ["_app/immutable/assets/0.8g-YxAMm.css"];
export const fonts = [];
