interface $$__sveltets_2_IsomorphicComponent<Props extends Record<string, any> = any, Events extends Record<string, any> = any, Slots extends Record<string, any> = any, Exports = {}, Bindings = string> {
    new (options: import('svelte').ComponentConstructorOptions<Props>): import('svelte').SvelteComponent<Props, Events, Slots> & {
        $$bindings?: Bindings;
    } & Exports;
    (internal: unknown, props: Props & {
        $$events?: Events;
        $$slots?: Slots;
    }): Exports & {
        $set?: any;
        $on?: any;
    };
    z_$$bindings?: Bindings;
}
declare const PhylogeneticTreeViewer: $$__sveltets_2_IsomorphicComponent<{
    data?: any;
    width?: number;
    height?: number;
    branchLengthProperty?: string;
    colorBranches?: string;
    showLabels?: boolean;
    treeIndex?: number;
}, {
    [evt: string]: CustomEvent<any>;
}, {}, {}, string>;
type PhylogeneticTreeViewer = InstanceType<typeof PhylogeneticTreeViewer>;
export default PhylogeneticTreeViewer;
