declare const storybookSveltekitPlugin: () => {
    name: string;
    config: () => {
        resolve: {
            alias: {
                '$app/forms': string;
                '$app/navigation': string;
                '$app/stores': string;
            };
        };
    };
}[];

export { storybookSveltekitPlugin };
