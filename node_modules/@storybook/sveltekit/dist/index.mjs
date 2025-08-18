import { preview_exports } from './chunk-REI2Y3HY.mjs';
import './chunk-CEH6MNVV.mjs';
import { composeConfigs, setDefaultProjectAnnotations, setProjectAnnotations as setProjectAnnotations$1 } from 'storybook/internal/preview-api';
import { INTERNAL_DEFAULT_PROJECT_ANNOTATIONS as INTERNAL_DEFAULT_PROJECT_ANNOTATIONS$1 } from '@storybook/svelte';

function setProjectAnnotations(projectAnnotations){return setDefaultProjectAnnotations(INTERNAL_DEFAULT_PROJECT_ANNOTATIONS),setProjectAnnotations$1(projectAnnotations)}var INTERNAL_DEFAULT_PROJECT_ANNOTATIONS=composeConfigs([INTERNAL_DEFAULT_PROJECT_ANNOTATIONS$1,preview_exports]);

export { setProjectAnnotations };
