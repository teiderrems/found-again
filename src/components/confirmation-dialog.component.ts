// confirmation-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info'; // danger = rouge, warning = orange, info = bleu
  confirmAction?: string; // Pour les actions comme 'DELETE', 'UPDATE', etc.
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CommonModule, FormsModule],
  template: `
    <div class="p-6 w-full max-w-md">
      <!-- Header avec icône -->
      <div class="flex items-center gap-3 mb-6">
        <div [ngClass]="getIconClass()">
          <mat-icon class="text-white text-2xl">{{ getIcon() }}</mat-icon>
        </div>
        <h2 class="text-2xl font-bold text-gray-900">{{ data.title }}</h2>
      </div>

      <!-- Message -->
      <p class="text-gray-600 mb-6 text-base">
        {{ data.message }}
      </p>

      <!-- Input pour confirmation si type 'danger' -->
      @if (data.type === 'danger' && data.confirmAction) {
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Confirmez en écrivant "<span class="text-red-600 font-bold">{{ data.confirmAction }}</span>":
          </label>
          <input
            type="text"
            [(ngModel)]="confirmationInput"
            (keyup.enter)="onConfirm()"
            class="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm"
            placeholder="Écrivez le texte de confirmation">
        </div>
      }

      <!-- Boutons d'action -->
      <div class="flex gap-3 justify-end">
        <button
          mat-stroked-button
          (click)="onCancel()"
          class="text-gray-600">
          {{ data.cancelText || 'Annuler' }}
        </button>
        <button
          mat-raised-button
          (click)="onConfirm()"
          [disabled]="isConfirmDisabled()"
          [ngClass]="getButtonClass()">
          {{ data.confirmText || 'Confirmer' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .mat-mdc-dialog-container {
        padding: 0;
      }
    }
  `]
})
export class ConfirmationDialogComponent {
  confirmationInput = '';

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  getIcon(): string {
    switch (this.data.type) {
      case 'danger':
        return 'delete_outline';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  }

  getIconClass(): string {
    const baseClass = 'p-2 rounded-lg';
    switch (this.data.type) {
      case 'danger':
        return `${baseClass} bg-red-500`;
      case 'warning':
        return `${baseClass} bg-orange-500`;
      case 'info':
      default:
        return `${baseClass} bg-blue-500`;
    }
  }

  getButtonClass(): string {
    switch (this.data.type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700 text-white';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  }

  isConfirmDisabled(): boolean {
    if (this.data.type === 'danger' && this.data.confirmAction) {
      return this.confirmationInput !== this.data.confirmAction;
    }
    return false;
  }

  onConfirm(): void {
    if (!this.isConfirmDisabled()) {
      this.dialogRef.close(true);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
