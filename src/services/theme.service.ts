// theme.service.ts
import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSignal = signal<Theme>('light');
  
  // Expose a readonly signal for components
  readonly theme = this.themeSignal.asReadonly();
  readonly isDark = computed(() => this.themeSignal() === 'dark');

  constructor() {
    // Vérifier le thème système ou localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme: Theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    this.setTheme(initialTheme);

    // Écouter les changements de préférence système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Seulement si l'utilisateur n'a pas de préférence sauvegardée
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  setTheme(theme: Theme) {
    this.themeSignal.set(theme);
    
    // Mettre à jour la classe sur le document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('theme', theme);
  }

  toggleTheme() {
    const newTheme: Theme = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  getTheme(): Theme {
    return this.themeSignal();
  }
}