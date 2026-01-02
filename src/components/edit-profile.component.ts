// edit-profile-dialog.component.ts
import { Component, Inject } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { UserProfile } from '../types/user';

@Component({
  selector: 'app-edit-profile-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-3">
      <div class="p-2 bg-[#009245] rounded-lg">
        <mat-icon class="text-white">edit</mat-icon>
      </div>
      <span class="text-2xl font-bold text-gray-900 dark:text-white">Modifier le profil</span>
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="editForm" (ngSubmit)="onSubmit()" class="space-y-4 flex flex-col justify-center pt-2">
        <!-- Prénom -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Prénom <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            formControlName="firstname"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-[#009245] focus:ring-1 focus:ring-[#009245]"
            placeholder="Votre prénom">
          @if (editForm.get('firstname')?.hasError('required') && editForm.get('firstname')?.touched) {
            <div class="text-red-500 text-xs">
              Le prénom est requis
            </div>
          }
        </div>
    
        <!-- Nom -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Nom <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            formControlName="lastname"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-[#009245] focus:ring-1 focus:ring-[#009245]"
            placeholder="Votre nom">
          @if (editForm.get('lastname')?.hasError('required') && editForm.get('lastname')?.touched) {
            <div class="text-red-500 text-xs">
              Le nom est requis
            </div>
          }
        </div>
    
        <!-- Téléphone -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Téléphone</label>
          <input
            type="tel"
            formControlName="phone"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-[#009245] focus:ring-1 focus:ring-[#009245]"
            placeholder="0123456789">
        </div>
    
        <!-- Localisation -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Localisation</label>
          <input
            type="text"
            formControlName="location"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-[#009245] focus:ring-1 focus:ring-[#009245]"
            placeholder="Votre localisation">
        </div>
    
        <!-- Bio -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Bio</label>
          <textarea
            formControlName="bio"
            rows="4"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-[#009245] focus:ring-1 focus:ring-[#009245] resize-none"
          placeholder="Parlez un peu de vous..."></textarea>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="gap-2">
      <button
        mat-stroked-button
        (click)="onCancel()">
        Annuler
      </button>
      <button
        mat-raised-button
        color="primary"
        (click)="onSubmit()"
        [disabled]="!editForm.valid || editForm.pristine">
        Enregistrer
      </button>
    </mat-dialog-actions>
    `,
  styles: [`
    :host {
      display: block;
    }
    /* Override primary color for this component if needed, or rely on global theme */
    .mat-mdc-raised-button.mat-primary {
        --mdc-protected-button-container-color: #009245;
        --mdc-protected-button-label-text-color: white;
    }
  `]
})
export class EditProfileDialogComponent {
  editForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { profile: UserProfile }
  ) {
    this.editForm = this.fb.group({
      firstname: [data.profile.firstname, Validators.required],
      lastname: [data.profile.lastname, Validators.required],
      phone: [data.profile.phone || ''],
      location: [data.profile.location || ''],
      bio: [data.profile.bio || '']
    });
  }

  onSubmit() {
    if (this.editForm.valid) {
      this.dialogRef.close(this.editForm.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}