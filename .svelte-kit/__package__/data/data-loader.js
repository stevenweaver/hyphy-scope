// Data loading function that fetches JSON files as static assets
export async function getTestData(analysis) {
    try {
        // In development, use the src path; in production, these will be served from static
        const response = await fetch(`/src/data/${analysis}_test_data.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${analysis} test data: ${response.statusText}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error(`Failed to load test data for ${analysis}:`, error);
        return null;
    }
}
// Re-export the existing loader functions
export { loadDataFromUrl, loadDataFromStorage } from '../utils/fel-utils.js';
