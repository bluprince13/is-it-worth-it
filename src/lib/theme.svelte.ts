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

class ThemeStore {
	current = $state<Theme>('light');

	/** Adopts the theme app.html already applied, then follows the system until one is chosen. */
	init(): void {
		this.current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			if (!storedTheme()) this.current = e.matches ? 'dark' : 'light';
		});
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
