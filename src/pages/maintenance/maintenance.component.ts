import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 relative overflow-hidden">
      <!-- Background Elements -->
      <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-linear-to-br from-orange-100/40 to-transparent blur-3xl"></div>
        <div class="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-linear-to-tr from-yellow-100/40 to-transparent blur-3xl"></div>
      </div>

      <div class="text-center max-w-lg relative z-10">
        <div class="mb-8 flex justify-center">
          <div class="bg-orange-100 p-6 rounded-full">
            <mat-icon class="text-6xl text-orange-600 w-16 h-16 flex items-center justify-center">engineering</mat-icon>
          </div>
        </div>
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Maintenance en cours</h1>
        <p class="text-lg text-gray-600 mb-8">
          Nous effectuons actuellement une maintenance planifiée pour améliorer nos services. 
          L'application sera de nouveau disponible très bientôt.
        </p>
        <p class="text-sm text-gray-500">
          Merci de votre patience.
        </p>
      </div>
    </div>
  `
})
export class MaintenanceComponent {}
