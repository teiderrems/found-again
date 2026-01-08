// theme.service.ts
import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'light' | 'dark'| 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSignal = signal<Theme>( (localStorage.getItem('theme') as Theme) || 'system');

  // Expose a readonly signal for components
  readonly theme = this.themeSignal.asReadonly();

  // The actual visual state (calculated based on theme selection + system preference)
  readonly isDark = computed(() => {
    const current = this.themeSignal();
    if (current === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return current === 'dark';
  });

  constructor() {
    // Apply initial class to document
    this.updateRender(this.isDark());

    // Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      // Only re-render if we are in 'auto' mode
      if (this.themeSignal() === 'system') {
        this.updateRender(this.isDark());
      }
    });
  }

  setTheme(theme: Theme) {
    this.themeSignal.set(theme);

    // Mettre à jour la classe sur le document
    this.updateRender(this.isDark());

    // Sauvegarder dans localStorage
    localStorage.setItem('theme', theme);
  }
  // Extracted logic to keep code clean
  private updateRender(isDark: boolean) {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleTheme() {
    const newTheme: Theme = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  getTheme(): Theme {
    return this.themeSignal();
  }
}
