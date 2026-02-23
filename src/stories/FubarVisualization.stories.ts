import type { Meta, StoryObj } from '@storybook/svelte';
import FubarVisualization from '$lib/FubarVisualization.svelte';
import { loadFubarTestData } from './data/fubar-test-data';

const meta = {
  title: 'Visualizations/FUBAR Visualization',
  component: FubarVisualization,
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'FUBAR/B-STILL analysis results data in HyPhy JSON format'
    }
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'FUBAR (Fast Unconstrained Bayesian AppRoximation) visualization component. Supports both standard FUBAR and B-STILL variant. Includes summary, significant sites table, Manhattan plot, rates plot, heatmap, site posterior deep dive, and phylogenetic tree.'
      }
    }
  },
  loaders: [async () => ({ fubarData: await loadFubarTestData() })]
} satisfies Meta<FubarVisualization>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args, { loaded: { fubarData } }) => ({
    Component: FubarVisualization,
    props: { ...args, data: fubarData }
  }),
  args: {}
};

export const Loading: Story = {
  args: {
    data: null
  }
};
