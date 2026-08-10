import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AxomemeVisualization from './AxomemeVisualization.svelte';
import type { AxomemeSiteData } from './utils/axomeme-utils.js';

// Observable Plot is exercised directly in axomeme-utils tests; here it is stubbed so a component
// test never depends on SVG layout in jsdom.
vi.mock('@observablehq/plot', () => {
	const stub = () => ({});
	return {
		plot: vi.fn(() => {
			const div = document.createElement('div');
			div.innerHTML = '<svg><text>plot</text></svg>';
			return div;
		}),
		dot: stub,
		ruleY: stub,
		ruleX: stub,
		rectY: stub,
		line: stub,
		binX: stub
	};
});

function site(i: number, over: Partial<AxomemeSiteData> = {}): AxomemeSiteData {
	return {
		site: i,
		refCodon: 'ATG',
		refAa: 'M',
		isVariable: true,
		lrt: i / 10,
		logLrt: Math.log1p(i / 10),
		alphaDs: 0.4,
		betaPosDn: 1.1,
		pPos: 0.9,
		zScore: 0.5,
		percentile: i,
		call: 'Neutral',
		...over
	};
}

const result = {
	modelVersion: '2.0-viral-finetuned',
	sites: [
		...Array.from({ length: 20 }, (_, i) => site(i + 1)),
		site(21, { call: 'Top 5%', lrt: 3.0, percentile: 96 }),
		site(22, { call: 'Top 2%', lrt: 4.0, percentile: 99 }),
		site(23, { isVariable: false, lrt: 0, percentile: 0 })
	],
	summary: { callMode: 'percentile', referenceSequence: 'Human' }
};

describe('AxomemeVisualization', () => {
	it('renders an empty state rather than a broken table when there is no data', () => {
		render(AxomemeVisualization, { props: { data: null } });
		expect(screen.getByText(/No AxoMEME results/i)).toBeInTheDocument();
	});

	it('renders without hanging', () => {
		// This test exists because an earlier version froze the browser tab. Reactive statements that
		// assign to a value other statements depend on can loop forever, and the symptom is a page that
		// stops responding rather than an error — nothing in a normal assertion catches it.
		const start = Date.now();
		render(AxomemeVisualization, { props: { data: result } });
		expect(screen.getByText('AxoMEME predictions')).toBeInTheDocument();
		expect(Date.now() - start).toBeLessThan(5000);
	});

	it('says the score is not calibrated, in the copy a reader sees first', () => {
		render(AxomemeVisualization, { props: { data: result } });
		expect(screen.getByText(/not calibrated/i)).toBeInTheDocument();
		expect(screen.getByText(/MEME was not run/i)).toBeInTheDocument();
	});

	it('counts only scored sites, and only called ones as top-ranked', () => {
		const { container } = render(AxomemeVisualization, { props: { data: result } });
		// Scoped to the summary strip: bare numbers also appear in the table, so getByText is ambiguous.
		const stats = [...container.querySelectorAll('.axomeme-stat strong')].map((n) => n.textContent);
		// 23 sites total, 22 scored (one invariant), 2 called.
		expect(stats[0]).toBe('2'); // top-ranked
		expect(stats[1]).toBe('22'); // scored
		expect(stats[2]).toBe('23'); // total
	});

	it('shows the tier labels the calling mode produced, not a confidence word', () => {
		render(AxomemeVisualization, { props: { data: result } });
		expect(screen.getByText('Top 2%')).toBeInTheDocument();
		expect(screen.getByText('Top 5%')).toBeInTheDocument();
		expect(screen.queryByText(/Tier 1 \(High\)/)).not.toBeInTheDocument();
	});

	it('falls back to all scored sites when nothing was called', () => {
		// An empty table reads as a failure rather than as a result.
		const none = { ...result, sites: Array.from({ length: 5 }, (_, i) => site(i + 1)) };
		render(AxomemeVisualization, { props: { data: none } });
		expect(screen.getByText('AxoMEME predictions')).toBeInTheDocument();
		expect(screen.getAllByText('Neutral').length).toBeGreaterThan(0);
	});

	it('marks an invariant site as not scored rather than showing it as zero', () => {
		const withInvariant = {
			...result,
			sites: [site(1, { isVariable: false }), site(2, { call: 'Top 2%' })]
		};
		render(AxomemeVisualization, { props: { data: withInvariant, onlyCalled: false } });
		expect(screen.getByText(/not scored/i)).toBeInTheDocument();
	});
});
