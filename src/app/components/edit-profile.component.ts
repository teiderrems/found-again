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
    <div class="p-6">
      <h2 mat-dialog-title class="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        <mat-icon class="align-middle mr-2">edit</mat-icon>
        Modifier le profil
      </h2>

      <form [formGroup]="editForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content class="space-y-4">
          <!-- Prénom -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Prénom</mat-label>
            <input matInput formControlName="firstname">
            <mat-icon matPrefix>person</mat-icon>
            <mat-error *ngIf="editForm.get('firstname')?.hasError('required')">
              Le prénom est requis
            </mat-error>
          </mat-form-field>

          <!-- Nom -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Nom</mat-label>
            <input matInput formControlName="lastname">
            <mat-icon matPrefix>person_outline</mat-icon>
            <mat-error *ngIf="editForm.get('lastname')?.hasError('required')">
              Le nom est requis
            </mat-error>
          </mat-form-field>

          <!-- Téléphone -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Téléphone</mat-label>
            <input matInput formControlName="phone" type="tel">
            <mat-icon matPrefix>phone</mat-icon>
          </mat-form-field>

          <!-- Localisation -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Localisation</mat-label>
            <input matInput formControlName="location">
            <mat-icon matPrefix>location_on</mat-icon>
          </mat-form-field>

          <!-- Bio -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Bio</mat-label>
            <textarea matInput formControlName="bio" rows="3"></textarea>
            <mat-icon matPrefix>description</mat-icon>
          </mat-form-field>
        </mat-dialog-content>

        <mat-dialog-actions align="end" class="mt-6">
          <button mat-button type="button" (click)="onCancel()">
            Annuler
          </button>
          <button 
            mat-raised-button 
            color="primary" 
            type="submit"
            [disabled]="!editForm.valid || editForm.pristine"
          >
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