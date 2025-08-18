import { StorybookConfig as StorybookConfig$1, CompatibleString } from 'storybook/internal/types';
import { BuilderOptions, StorybookConfigVite } from '@storybook/builder-vite';

declare function enhance(form: HTMLFormElement): {
    destroy(): void;
};

declare function goto(...args: any[]): Promise<void>;
declare function invalidate(...args: any[]): Promise<void>;
declare function invalidateAll(): Promise<void>;

type FrameworkName = CompatibleString<'@storybook/sveltekit'>;
type BuilderName = CompatibleString<'@storybook/builder-vite'>;
type FrameworkOptions = {
    builder?: BuilderOptions;
};
type StorybookConfigFramework = {
    framework: FrameworkName | {
        name: FrameworkName;
        options: FrameworkOptions;
    };
    core?: StorybookConfig$1['core'] & {
        builder?: BuilderName | {
            name: BuilderName;
            options: BuilderOptions;
        };
    };
};
type StorybookConfig = Omit<StorybookConfig$1, keyof StorybookConfigVite | keyof StorybookConfigFramework> & StorybookConfigVite & StorybookConfigFramework;
type NormalizedHrefConfig = {
    callback: (to: string, event: Event) => void;
    asRegex?: boolean;
};
type HrefConfig = NormalizedHrefConfig | NormalizedHrefConfig['callback'];
type SvelteKitParameters = Partial<{
    hrefs: Record<string, HrefConfig>;
    stores: {
        page: Record<string, any>;
        navigating: Record<string, any>;
        updated: boolean;
    };
    navigation: {
        goto: typeof goto;
        invalidate: typeof invalidate;
        invalidateAll: typeof invalidateAll;
        afterNavigate: Record<string, any>;
    };
    forms: {
        enhance: typeof enhance;
    };
}>;

export { FrameworkOptions as F, HrefConfig as H, NormalizedHrefConfig as N, StorybookConfig as S, SvelteKitParameters as a };
