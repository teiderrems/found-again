import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { SettingsService } from '@/services/settings.service';
import { AppSettings } from '@/types/settings';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './admin-settings.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AdminSettingsComponent implements OnInit {
  private snackBar = inject(MatSnackBar);
  private settingsService = inject(SettingsService);

  settings = signal<AppSettings>({
    appName: '',
    contactEmail: '',
    maintenanceMode: false,
    allowRegistration: true,
    maxUploadSize: 5,
    itemsPerPage: 10
  });

  isLoading = signal(false);

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.isLoading.set(true);
    this.settingsService.getSettings().subscribe({
      next: (data) => {
        this.settings.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading settings:', error);
        this.isLoading.set(false);
        this.showSnackBar('Erreur lors du chargement des paramètres', 'error');
      }
    });
  }

  async saveSettings() {
    this.isLoading.set(true);
    try {
      await this.settingsService.updateSettings(this.settings());
      this.showSnackBar('Paramètres enregistrés avec succès', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showSnackBar('Erreur lors de l\'enregistrement', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  private showSnackBar(message: string, type: 'success' | 'error') {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['bg-green-500', 'text-white'] : ['bg-red-500', 'text-white']
    });
  }
}
