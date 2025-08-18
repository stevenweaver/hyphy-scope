
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/absrel" | "/bgm" | "/busted" | "/components" | "/fade" | "/fel" | "/gard" | "/meme" | "/relax" | "/slac" | "/tree";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/absrel": Record<string, never>;
			"/bgm": Record<string, never>;
			"/busted": Record<string, never>;
			"/components": Record<string, never>;
			"/fade": Record<string, never>;
			"/fel": Record<string, never>;
			"/gard": Record<string, never>;
			"/meme": Record<string, never>;
			"/relax": Record<string, never>;
			"/slac": Record<string, never>;
			"/tree": Record<string, never>
		};
		Pathname(): "/" | "/absrel" | "/bgm" | "/busted" | "/components" | "/fade" | "/fel" | "/gard" | "/meme" | "/relax" | "/slac" | "/tree";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): never;
	}
}