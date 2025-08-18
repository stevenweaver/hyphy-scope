import './chunk-CEH6MNVV.mjs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

var filename=__filename??fileURLToPath(import.meta.url),dir=dirname(filename);function mockSveltekitStores(){return {name:"storybook:sveltekit-mock-stores",config:()=>({resolve:{alias:{"$app/forms":resolve(dir,"../src/mocks/app/forms.ts"),"$app/navigation":resolve(dir,"../src/mocks/app/navigation.ts"),"$app/stores":resolve(dir,"../src/mocks/app/stores.ts")}}})}}var storybookSveltekitPlugin=()=>[mockSveltekitStores()];

export { storybookSveltekitPlugin };
