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
    <div class=" p-6 w-full">
      <div class="flex items-center gap-3 mb-6">
        <div class="p-2 bg-[#009245] rounded-lg">
          <mat-icon class="text-white">edit</mat-icon>
        </div>
        <h2 class="text-2xl font-bold text-gray-900">Modifier le profil</h2>
      </div>
    
      <form [formGroup]="editForm" (ngSubmit)="onSubmit()" class="space-y-4  flex flex-col justify-center">
        <!-- Prénom -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700">
            Prénom <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            formControlName="firstname"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009245] focus:ring-1 focus:ring-[#009245]"
            placeholder="Votre prénom">
          @if (editForm.get('firstname')?.hasError('required') && editForm.get('firstname')?.touched) {
            <div class="text-red-500 text-xs">
              Le prénom est requis
            </div>
          }
        </div>
    
        <!-- Nom -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700">
            Nom <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            formControlName="lastname"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009245] focus:ring-1 focus:ring-[#009245]"
            placeholder="Votre nom">
          @if (editForm.get('lastname')?.hasError('required') && editForm.get('lastname')?.touched) {
            <div class="text-red-500 text-xs">
              Le nom est requis
            </div>
          }
        </div>
    
        <!-- Téléphone -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700">Téléphone</label>
          <input
            type="tel"
            formControlName="phone"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009245] focus:ring-1 focus:ring-[#009245]"
            placeholder="0123456789">
        </div>
    
        <!-- Localisation -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700">Localisation</label>
          <input
            type="text"
            formControlName="location"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009245] focus:ring-1 focus:ring-[#009245]"
            placeholder="Votre localisation">
        </div>
    
        <!-- Bio -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700">Bio</label>
          <textarea
            formControlName="bio"
            rows="4"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009245] focus:ring-1 focus:ring-[#009245] resize-none"
          placeholder="Parlez un peu de vous..."></textarea>
        </div>
    
        <!-- Boutons -->
        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            (click)="onCancel()"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            Annuler
          </button>
          <button
            type="submit"
            [disabled]="!editForm.valid || editForm.pristine"
            class="px-4 py-2 bg-[#009245] text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
    `,
  styles: [`
    :host {
      display: block;
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