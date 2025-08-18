import { PresetProperty } from 'storybook/internal/types';
import { S as StorybookConfig } from './types-3f08d935.js';
import '@storybook/builder-vite';

declare const core: PresetProperty<'core'>;
declare const previewAnnotations: PresetProperty<'previewAnnotations'>;
declare const viteFinal: NonNullable<StorybookConfig['viteFinal']>;

export { core, previewAnnotations, viteFinal };
