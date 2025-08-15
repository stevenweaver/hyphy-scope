import { type MemeSiteData } from "./meme-utils.js";
interface PlotOption {
    label: string;
    available: (data: any) => boolean;
}
export declare function getMemePlotOptions(hasSiteLRT: boolean, hasResamples: number, bsPositiveSelection: any[]): PlotOption[];
export declare function getMemePlotDescription(plotType: string, hasResamples: number): string;
/**
 * Creates a scatter plot for p-values
 */
export declare function createMemePValuePlot(data: MemeSiteData[], pvalueThreshold: number): any;
/**
 * Creates a site rates plot showing α, β-, and β+ rates
 */
export declare function createMemeSiteRatesPlot(data: MemeSiteData[]): any;
/**
 * Creates a dense rate plot with multiple rate components
 */
export declare function createMemeDenseRatePlot(data: MemeSiteData[]): any;
/**
 * Creates rate density plots
 */
export declare function createMemeRateDensityPlot(data: MemeSiteData[]): any;
/**
 * Creates support for positive selection plot (Bayes factors)
 */
export declare function createMemeSupportPlot(bsData: Array<{
    Branch: string;
    Codon: number;
    Posterior: number;
    ER: number;
}>): any;
/**
 * Main function to create the appropriate plot based on type
 */
export declare function createMemePlot(plotType: string, data: MemeSiteData[], pvalueThreshold: number, bsData?: Array<{
    Branch: string;
    Codon: number;
    Posterior: number;
    ER: number;
}>): any;
export {};
