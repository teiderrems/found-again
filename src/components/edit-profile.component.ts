// edit-profile-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="p-8">
      <div class="flex items-center space-x-3 mb-6">
        <div class="p-3 bg-linear-to-br from-[#009245] to-green-700 rounded-xl">
          <mat-icon class="text-white text-2xl">edit</mat-icon>
        </div>
        <h2 mat-dialog-title class="text-3xl font-bold text-gray-900 dark:text-white m-0">
          Modifier le profil
        </h2>
      </div>

      <form [formGroup]="editForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content class="space-y-5 max-w-md">
          <!-- Prénom -->
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700">Prénom <span class="text-red-500">*</span></label>
            <div class="relative">
              <mat-icon matPrefix class="absolute left-4 top-1/2 -translate-y-1/2 text-[#009245] text-lg pointer-events-none">person</mat-icon>
              <input matInput 
                formControlName="firstname" 
                class="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#009245] focus:ring-2 focus:ring-[#009245]/10 outline-none transition-all duration-200"
                placeholder="Votre prénom">
            </div>
            <mat-error *ngIf="editForm.get('firstname')?.hasError('required')" class="text-red-500 text-xs mt-1">
              Le prénom est requis
            </mat-error>
          </div>

          <!-- Nom -->
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700">Nom <span class="text-red-500">*</span></label>
            <div class="relative">
              <mat-icon matPrefix class="absolute left-4 top-1/2 -translate-y-1/2 text-[#009245] text-lg pointer-events-none">person_outline</mat-icon>
              <input matInput 
                formControlName="lastname" 
                class="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#009245] focus:ring-2 focus:ring-[#009245]/10 outline-none transition-all duration-200"
                placeholder="Votre nom">
            </div>
            <mat-error *ngIf="editForm.get('lastname')?.hasError('required')" class="text-red-500 text-xs mt-1">
              Le nom est requis
            </mat-error>
          </div>

          <!-- Téléphone -->
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700">Téléphone</label>
            <div class="relative">
              <mat-icon matPrefix class="absolute left-4 top-1/2 -translate-y-1/2 text-[#009245] text-lg pointer-events-none">phone</mat-icon>
              <input matInput 
                formControlName="phone" 
                type="tel"
                class="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#009245] focus:ring-2 focus:ring-[#009245]/10 outline-none transition-all duration-200"
                placeholder="0123456789">
            </div>
          </div>

          <!-- Localisation -->
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700">Localisation</label>
            <div class="relative">
              <mat-icon matPrefix class="absolute left-4 top-1/2 -translate-y-1/2 text-[#009245] text-lg pointer-events-none">location_on</mat-icon>
              <input matInput 
                formControlName="location"
                class="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#009245] focus:ring-2 focus:ring-[#009245]/10 outline-none transition-all duration-200"
                placeholder="Votre localisation">
            </div>
          </div>

          <!-- Bio -->
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700">Bio</label>
            <textarea 
              matInput 
              formControlName="bio" 
              rows="4"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#009245] focus:ring-2 focus:ring-[#009245]/10 outline-none transition-all duration-200 resize-none"
              placeholder="Parlez un peu de vous..."></textarea>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end" class="mt-8 flex gap-3 justify-end">
          <button 
            mat-button 
            type="button" 
            (click)="onCancel()"
            class="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
            Annuler
          </button>
          <button 
            mat-raised-button 
            type="submit"
            [disabled]="!editForm.valid || editForm.pristine"
            class="px-6 py-2.5 bg-linear-to-r from-[#009245] to-green-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            <mat-icon class="mr-2">save</mat-icon>
            Enregistrer
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `
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