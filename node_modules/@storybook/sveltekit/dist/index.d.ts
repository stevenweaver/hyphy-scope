export { F as FrameworkOptions, H as HrefConfig, N as NormalizedHrefConfig, S as StorybookConfig, a as SvelteKitParameters } from './types-3f08d935.js';
import { NamedOrDefaultProjectAnnotations, NormalizedProjectAnnotations } from 'storybook/internal/types';
import { SvelteRenderer } from '@storybook/svelte';
import '@storybook/builder-vite';

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
 * import { setProjectAnnotations } from '@storybook/sveltekit';
 * import projectAnnotations from './.storybook/preview';
 *
 * setProjectAnnotations(projectAnnotations);
 * ```
 *
 * @param projectAnnotations - E.g. (import projectAnnotations from '../.storybook/preview')
 */
declare function setProjectAnnotations(projectAnnotations: NamedOrDefaultProjectAnnotations<any> | NamedOrDefaultProjectAnnotations<any>[]): NormalizedProjectAnnotations<SvelteRenderer>;

export { setProjectAnnotations };
