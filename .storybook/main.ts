import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
  "stories": [
    "../src/stories/**/*.mdx",
    "../src/stories/**/*.stories.@(js|ts|svelte)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-svelte-csf",
    "@storybook/addon-interactions"
  ],
  "framework": {
    "name": "@storybook/sveltekit",
    "options": {}
  }
};
export default config;