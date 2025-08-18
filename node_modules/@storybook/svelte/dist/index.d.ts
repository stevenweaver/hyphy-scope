import { Args, ComponentAnnotations, AnnotatedStoryFn, ArgsStoryFn, ArgsFromMeta, StoryAnnotations, StrictArgs, DecoratorFunction, LoaderFunction, StoryContext as StoryContext$1, ProjectAnnotations, NamedOrDefaultProjectAnnotations, NormalizedProjectAnnotations, StoryAnnotationsOrFn, Store_CSFExports, StoriesWithPartialProps, ComposedStoryFn } from 'storybook/internal/types';
export { ArgTypes, Args, Parameters, StrictArgs } from 'storybook/internal/types';
import { SvelteComponent, ComponentProps, ComponentType } from 'svelte';
import { Simplify, SetOptional } from 'type-fest';
import { a as Svelte5ComponentType, S as SvelteRenderer } from './types-b7d0039b.js';
import PreviewRender from '@storybook/svelte/internal/PreviewRender.svelte';

/**
 * Metadata to configure the stories for a component.
 *
 * @see [Default export](https://storybook.js.org/docs/api/csf#default-export)
 */
type Meta<CmpOrArgs = Args> = CmpOrArgs extends SvelteComponent<infer Props> | Svelte5ComponentType<infer Props> ? ComponentAnnotations<SvelteRenderer<CmpOrArgs>, Props> : ComponentAnnotations<SvelteRenderer, CmpOrArgs>;
/**
 * Story function that represents a CSFv2 component example.
 *
 * @see [Named Story exports](https://storybook.js.org/docs/api/csf#named-story-exports)
 */
type StoryFn<TCmpOrArgs = Args> = TCmpOrArgs extends SvelteComponent<infer Props> | Svelte5ComponentType<infer Props> ? AnnotatedStoryFn<SvelteRenderer, Props> : AnnotatedStoryFn<SvelteRenderer, TCmpOrArgs>;
/**
 * Story object that represents a CSFv3 component example.
 *
 * @see [Named Story exports](https://storybook.js.org/docs/api/csf#named-story-exports)
 */
type StoryObj<MetaOrCmpOrArgs = Args> = MetaOrCmpOrArgs extends {
    render?: ArgsStoryFn<SvelteRenderer, any>;
    component: infer Comp;
    args?: infer DefaultArgs;
} ? Simplify<ComponentProps<Comp extends ComponentType<infer Component> ? Component : Comp extends Svelte5ComponentType ? Comp : never> & ArgsFromMeta<SvelteRenderer, MetaOrCmpOrArgs>> extends infer TArgs ? StoryAnnotations<SvelteRenderer<Comp extends ComponentType<infer Component> ? Component : Comp extends Svelte5ComponentType ? Comp : never>, TArgs, SetOptional<TArgs, Extract<keyof TArgs, keyof DefaultArgs>>> : never : MetaOrCmpOrArgs extends SvelteComponent | Svelte5ComponentType ? StoryAnnotations<SvelteRenderer<MetaOrCmpOrArgs>, ComponentProps<MetaOrCmpOrArgs>> : StoryAnnotations<SvelteRenderer, MetaOrCmpOrArgs>;

type Decorator<TArgs = StrictArgs> = DecoratorFunction<SvelteRenderer, TArgs>;
type Loader<TArgs = StrictArgs> = LoaderFunction<SvelteRenderer, TArgs>;
type StoryContext<TArgs = StrictArgs> = StoryContext$1<SvelteRenderer, TArgs>;
type Preview = ProjectAnnotations<SvelteRenderer>;

type ComposedStory<TArgs extends Args = any> = ComposedStoryFn<SvelteRenderer, TArgs> & {
    Component: typeof PreviewRender;
    props: any;
};
type MapToComposed<TModule> = {
    [K in keyof TModule]: TModule[K] extends StoryAnnotationsOrFn<SvelteRenderer, infer TArgs extends Args> ? ComposedStory<TArgs> : never;
};
/**
 * Function that sets the globalConfig of your storybook. The global config is the preview module of
 * your .storybook folder.
 *
 * It should be run a single time, so that your global config (e.g. decorators) is applied to your
 * stories when using `composeStories` or `composeStory`.
 *
 * Example:
 *
 * ```jsx
 * // setup-file.js
 * import { setProjectAnnotations } from '@storybook/svelte';
 * import projectAnnotations from './.storybook/preview';
 *
 * setProjectAnnotations(projectAnnotations);
 * ```
 *
 * @param projectAnnotations - E.g. (import projectAnnotations from '../.storybook/preview')
 */
declare function setProjectAnnotations(projectAnnotations: NamedOrDefaultProjectAnnotations<any> | NamedOrDefaultProjectAnnotations<any>[]): NormalizedProjectAnnotations<SvelteRenderer>;
declare const INTERNAL_DEFAULT_PROJECT_ANNOTATIONS: ProjectAnnotations<SvelteRenderer>;
/**
 * Function that will receive a story along with meta (e.g. a default export from a .stories file)
 * and optionally projectAnnotations e.g. (import * from '../.storybook/preview) and will return a
 * composed component that has all args/parameters/decorators/etc combined and applied to it.
 *
 * It's very useful for reusing a story in scenarios outside of Storybook like unit testing.
 *
 * Example:
 *
 * ```jsx
 * import { render } from '@testing-library/svelte';
 * import { composeStory } from '@storybook/svelte';
 * import Meta, { Primary as PrimaryStory } from './Button.stories';
 *
 * const Primary = composeStory(PrimaryStory, Meta);
 *
 * test('renders primary button with Hello World', () => {
 *   const { getByText } = render(Primary, { label: 'Hello world' });
 *   expect(getByText(/Hello world/i)).not.toBeNull();
 * });
 * ```
 *
 * @param story
 * @param componentAnnotations - E.g. (import Meta from './Button.stories')
 * @param [projectAnnotations] - E.g. (import * as projectAnnotations from '../.storybook/preview')
 *   this can be applied automatically if you use `setProjectAnnotations` in your setup files.
 * @param [exportsName] - In case your story does not contain a name and you want it to have a name.
 */
declare function composeStory<TArgs extends Args = Args>(story: StoryAnnotationsOrFn<SvelteRenderer, TArgs>, componentAnnotations: Meta<TArgs | any>, projectAnnotations?: ProjectAnnotations<SvelteRenderer>, exportsName?: string): ComposedStory<TArgs>;
/**
 * Function that will receive a stories import (e.g. `import * as stories from './Button.stories'`)
 * and optionally projectAnnotations (e.g. `import * from '../.storybook/preview`) and will return
 * an object containing all the stories passed, but now as a composed component that has all
 * args/parameters/decorators/etc combined and applied to it.
 *
 * It's very useful for reusing stories in scenarios outside of Storybook like unit testing.
 *
 * Example:
 *
 * ```jsx
 * import { render } from '@testing-library/svelte';
 * import { composeStories } from '@storybook/svelte';
 * import * as stories from './Button.stories';
 *
 * const { Primary, Secondary } = composeStories(stories);
 *
 * test('renders primary button with Hello World', () => {
 *   const { getByText } = render(Primary, { label: 'Hello world' });
 *   expect(getByText(/Hello world/i)).not.toBeNull();
 * });
 * ```
 *
 * @param csfExports - E.g. (import * as stories from './Button.stories')
 * @param [projectAnnotations] - E.g. (import * as projectAnnotations from '../.storybook/preview')
 *   this can be applied automatically if you use `setProjectAnnotations` in your setup files.
 */
declare function composeStories<TModule extends Store_CSFExports<SvelteRenderer, any>>(csfExports: TModule, projectAnnotations?: ProjectAnnotations<SvelteRenderer>): Omit<MapToComposed<StoriesWithPartialProps<SvelteRenderer, TModule>>, keyof Store_CSFExports>;

export { Decorator, INTERNAL_DEFAULT_PROJECT_ANNOTATIONS, Loader, Meta, Preview, StoryContext, StoryFn, StoryObj, SvelteRenderer, composeStories, composeStory, setProjectAnnotations };
