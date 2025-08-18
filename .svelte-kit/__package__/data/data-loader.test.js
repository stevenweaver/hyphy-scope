import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTestData } from './data-loader';
// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;
describe('Data Loader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('fetches FEL test data successfully', async () => {
        const mockData = { MLE: { content: {} }, input: {} };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData
        });
        const result = await getTestData('fel');
        expect(mockFetch).toHaveBeenCalledWith('/src/data/fel_test_data.json');
        expect(result).toEqual(mockData);
    });
    it('fetches MEME test data successfully', async () => {
        const mockData = { MLE: { content: {} }, input: {} };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData
        });
        const result = await getTestData('meme');
        expect(mockFetch).toHaveBeenCalledWith('/src/data/meme_test_data.json');
        expect(result).toEqual(mockData);
    });
    it('fetches ABSREL test data successfully', async () => {
        const mockData = { "test results": {}, input: {} };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData
        });
        const result = await getTestData('absrel');
        expect(mockFetch).toHaveBeenCalledWith('/src/data/absrel_test_data.json');
        expect(result).toEqual(mockData);
    });
    it('handles fetch errors gracefully', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Not Found'
        });
        const result = await getTestData('fel');
        expect(result).toBeNull();
    });
    it('handles network errors gracefully', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const result = await getTestData('fel');
        expect(result).toBeNull();
    });
    it('handles JSON parsing errors gracefully', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => {
                throw new Error('Invalid JSON');
            }
        });
        const result = await getTestData('fel');
        expect(result).toBeNull();
    });
    it('supports all analysis types', async () => {
        const analysisTypes = ['fel', 'meme', 'slac', 'busted', 'absrel', 'relax', 'bgm', 'fade', 'gard'];
        for (const type of analysisTypes) {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: 'mock' })
            });
            const result = await getTestData(type);
            expect(result).toEqual({ data: 'mock' });
            expect(mockFetch).toHaveBeenCalledWith(`/src/data/${type}_test_data.json`);
        }
    });
});
