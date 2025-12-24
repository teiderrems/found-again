import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DeclarationData } from '@/types/declaration';

@Component({
  selector: 'app-verify-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="navigateToVerify()"
      class="w-full bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 sm:py-3 rounded-xl text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95">
      <span class="flex items-center justify-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
        </svg>
        <span>Vérifier l'identité</span>
      </span>
    </button>
  `
})
export class VerifyButtonComponent {
  @Input() declarationId!: string;

  constructor(private router: Router) {}

  navigateToVerify() {
    this.router.navigate(['/verify-identity', this.declarationId]);
  }
}
