export type AnalysisType = 'fel' | 'meme' | 'slac' | 'busted' | 'absrel' | 'relax' | 'bgm' | 'fade' | 'gard';
export declare function getTestData(analysis: AnalysisType): Promise<any>;
export { loadDataFromUrl, loadDataFromStorage } from '../utils/fel-utils.js';
