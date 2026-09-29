type Theme = 'light' | 'dark';

const STORAGE_KEY = 'is-it-worth-it:theme';

function storedTheme(): Theme | null {
	try {
		const value = localStorage.getItem(STORAGE_KEY);
		return value === 'light' || value === 'dark' ? value : null;
	} catch {
		return null;
	}
}

function systemTheme(): Theme {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

class ThemeStore {
	current = $state<Theme>('light');

	/** Picks up the saved or system theme; called once on the client after mount. */
	init(): void {
		this.current = storedTheme() ?? systemTheme();
	}

	toggle(): void {
		this.current = this.current === 'dark' ? 'light' : 'dark';
		try {
			localStorage.setItem(STORAGE_KEY, this.current);
		} catch {
			// Storage can be unavailable (private mode, blocked site data).
		}
	}
}

export const theme = new ThemeStore();
