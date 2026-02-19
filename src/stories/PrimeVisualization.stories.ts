import type { Meta, StoryObj } from '@storybook/svelte';
import PrimeVisualization from '$lib/PrimeVisualization.svelte';
import { loadPrimeTestData } from './data/prime-test-data';

const meta = {
  title: 'Visualizations/PRIME Visualization',
  component: PrimeVisualization,
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'PRIME analysis results data in HyPhy JSON format'
    },
    fdrThreshold: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'FDR threshold (q-value) for significance'
    }
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'PRIME (PRoperty Informed Models of Evolution) visualization component. Tests whether amino acid exchangeability depends on physicochemical properties. Includes Summary, Properties, Deep Dive, and 3D Structure sections.'
      }
    }
  },
  loaders: [async () => ({ primeData: await loadPrimeTestData() })]
} satisfies Meta<PrimeVisualization>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args, { loaded: { primeData } }) => ({
    Component: PrimeVisualization,
    props: { ...args, data: primeData }
  }),
  args: {
    fdrThreshold: 0.1
  }
};

export const HighThreshold: Story = {
  render: (args, { loaded: { primeData } }) => ({
    Component: PrimeVisualization,
    props: { ...args, data: primeData }
  }),
  args: {
    fdrThreshold: 0.25
  },
  parameters: {
    docs: {
      description: {
        story: 'PRIME visualization with a relaxed FDR threshold (0.25), showing more significant sites.'
      }
    }
  }
};

export const StrictThreshold: Story = {
  render: (args, { loaded: { primeData } }) => ({
    Component: PrimeVisualization,
    props: { ...args, data: primeData }
  }),
  args: {
    fdrThreshold: 0.01
  },
  parameters: {
    docs: {
      description: {
        story: 'PRIME visualization with a strict FDR threshold (0.01), showing fewer significant sites.'
      }
    }
  }
};

export const Loading: Story = {
  args: {
    data: null,
    fdrThreshold: 0.1
  }
};
