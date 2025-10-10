// Define available analysis types
export type AnalysisType = 'fel' | 'meme' | 'slac' | 'busted' | 'absrel' | 'relax' | 'bgm' | 'fade' | 'gard' | 'fubar' | 'multihit';

// Data loading function that fetches JSON files as static assets
export async function getTestData(analysis: AnalysisType): Promise<any> {
  try {
    // In development, use the src path; in production, these will be served from static
    const response = await fetch(`/src/data/${analysis}_test_data.json`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${analysis} test data: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to load test data for ${analysis}:`, error);
    return null;
  }
}

// Loader functions for URL and localStorage (moved from fel-utils)
export async function loadDataFromUrl(url: string): Promise<any | null> {
  if (!url) return null;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    // Accept data if it has MLE (BGM, FEL, etc.) or test results (other analyses)
    return data?.MLE || data?.['test results'] ? data : null;
  } catch (error) {
    console.error('Error loading JSON from URL:', error);
    return null;
  }
}

export function loadDataFromStorage(id: string): any | null {
  if (!id) return null;
  
  try {
    const key = `hyphy-results-${id}`;
    const localData = localStorage.getItem(key);
    if (localData) {
      const data = JSON.parse(localData);
      return data?.MLE ? data : null;
    }
  } catch (error) {
    console.error('Error parsing localStorage data:', error);
  }
  
  return null;
}