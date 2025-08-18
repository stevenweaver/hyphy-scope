export type AnalysisType = 'fel' | 'meme' | 'slac' | 'busted' | 'absrel' | 'relax' | 'bgm' | 'fade' | 'gard';
export declare function getTestData(analysis: AnalysisType): Promise<any>;
export declare function loadDataFromUrl(url: string): Promise<any | null>;
export declare function loadDataFromStorage(id: string): any | null;
