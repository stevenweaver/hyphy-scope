export declare const mockAbsrelData: {
    sequences: number;
    sites: number;
    "branches tested": number;
    "branches with selection": number;
    "p-value threshold": number;
    "test results": {
        Node1: {
            LRT: number;
            p: number;
            "uncorrected p": number;
            "corrected p": number;
        };
        Node2: {
            LRT: number;
            p: number;
            "uncorrected p": number;
            "corrected p": number;
        };
    };
    "branch attributes": {
        "0": {
            Node1: {
                "Rate Distributions": {
                    "0": number[][];
                    "1": number[][];
                };
                "original name": string;
            };
            Node2: {
                "Rate Distributions": {
                    "0": number[][];
                    "1": number[][];
                };
                "original name": string;
            };
        };
    };
    fits: {
        "Baseline model": {
            "log-likelihood": number;
            parameters: number;
            AIC: number;
        };
        "Full adaptive model": {
            "log-likelihood": number;
            parameters: number;
            AIC: number;
        };
    };
    "data partitions": {
        "0": {
            coverage: number[][];
        };
    };
    input: {
        "number of sequences": number;
        "number of sites": number;
        "partition count": number;
    };
    analysis: {
        citation: string;
    };
};
export declare const expectedAbsrelTileSpecs: {
    number: number;
    description: string;
    icon: string;
    color: string;
}[];
