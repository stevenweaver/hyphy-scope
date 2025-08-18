import * as svelte from 'svelte';
import { SvelteComponent, ComponentEvents, ComponentConstructorOptions } from 'svelte';
import { WebRenderer, Canvas } from 'storybook/internal/types';

type ComponentType<Props extends Record<string, any> = any, Events extends Record<string, any> = any> = new (options: ComponentConstructorOptions<Props>) => {
    [P in keyof SvelteComponent<Props> as P extends `$$${string}` ? never : P]: SvelteComponent<Props, Events>[P];
};
type Svelte5ComponentType<Props extends Record<string, any> = any> = typeof svelte extends {
    mount: any;
} ? svelte.Component<Props, any, any> : never;
interface SvelteRenderer<C extends SvelteComponent | Svelte5ComponentType = SvelteComponent> extends WebRenderer {
    component: ComponentType<this['T'] extends Record<string, any> ? this['T'] : any> | Svelte5ComponentType<this['T'] extends Record<string, any> ? this['T'] : any>;
    storyResult: this['T'] extends Record<string, any> ? SvelteStoryResult<this['T'], C extends SvelteComponent ? ComponentEvents<C> : {}> : SvelteStoryResult;
    mount: (Component?: ComponentType | Svelte5ComponentType, options?: Record<string, any> & {
        props: Record<string, any>;
    }) => Promise<Canvas>;
}
interface SvelteStoryResult<Props extends Record<string, any> = any, Events extends Record<string, any> = any> {
    Component?: ComponentType<Props> | Svelte5ComponentType<Props>;
    on?: Record<string, any> extends Events ? Record<string, (event: CustomEvent) => void> : {
        [K in keyof Events as string extends K ? never : K]?: (event: Events[K]) => void;
    };
    props?: Props;
    decorator?: ComponentType<Props> | Svelte5ComponentType<Props>;
}

export { SvelteRenderer as S, Svelte5ComponentType as a };
