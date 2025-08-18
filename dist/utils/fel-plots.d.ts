interface SiteData {
    partition: number;
    codon: number;
    Site: number;
    alpha: number;
    beta: number;
    "alpha=beta": number;
    "dN/dS MLE": number;
    "p-value": number;
    "p-asmp"?: number;
    "dN/dS LB"?: number;
    "dN/dS UB"?: number;
    class: "Diversifying" | "Purifying" | "Neutral" | "Invariable";
    [key: string]: any;
}
interface PlotOption {
    label: string;
    available: (data: any) => boolean;
}
export declare function getFelPlotOptions(hasPasmt: boolean): PlotOption[];
export declare function getFelPlotDescription(plotType: string, pvalueThreshold: number): string;
/**
 * Creates an Observable Plot for dN/dS estimates with confidence intervals
 */
export declare function createDnDsPlot(data: SiteData[]): any;
/**
 * Creates an Observable Plot for alpha/beta rate estimates matching the original FEL visualization
 */
export declare function createAlphaBetaPlot(data: SiteData[]): any;
/**
 * Creates an Observable Plot for p-value comparison
 */
export declare function createPValuePlot(data: SiteData[], pvalueThreshold: number): any;
/**
 * Creates a rate density plot
 */
export declare function createRateDensityPlot(data: SiteData[]): any;
/**
 * Main function to create the appropriate plot based on type
 */
export declare function createFelPlot(plotType: string, data: SiteData[], pvalueThreshold: number): any;
export {};
