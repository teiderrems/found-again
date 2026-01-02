import { Injectable, inject, signal, computed, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, doc, setDoc, docData } from '@angular/fire/firestore';
import { Observable, map, tap } from 'rxjs';
import { AppSettings } from '@/types/settings';
import { Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private firestore = inject(Firestore);
  private titleService = inject(Title);
  private injector = inject(Injector);
  
  private readonly SETTINGS_COLLECTION = 'settings';
  private readonly CONFIG_DOC_ID = 'config';

  // Signal to hold the current settings
  readonly settings = signal<AppSettings>(this.getDefaultSettings());

  // Computed signals for specific values
  readonly appName = computed(() => this.settings().appName);
  readonly contactEmail = computed(() => this.settings().contactEmail);
  readonly itemsPerPage = computed(() => this.settings().itemsPerPage);
  readonly maxUploadSize = computed(() => this.settings().maxUploadSize);
  readonly maintenanceMode = computed(() => this.settings().maintenanceMode);
  readonly allowRegistration = computed(() => this.settings().allowRegistration);

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    const docRef = doc(this.firestore, this.SETTINGS_COLLECTION, this.CONFIG_DOC_ID);
    runInInjectionContext(this.injector, () => docData(docRef)).pipe(
      map(data => {
        if (!data) {
          return this.getDefaultSettings();
        }
        return { ...this.getDefaultSettings(), ...data } as AppSettings;
      })
    ).subscribe(settings => {
      this.settings.set(settings);
      this.titleService.setTitle(settings.appName);
    });
  }

  getSettings(): Observable<AppSettings> {
    const docRef = doc(this.firestore, this.SETTINGS_COLLECTION, this.CONFIG_DOC_ID);
    return runInInjectionContext(this.injector, () => docData(docRef)).pipe(
      map(data => {
        if (!data) {
          return this.getDefaultSettings();
        }
        return { ...this.getDefaultSettings(), ...data } as AppSettings;
      })
    );
  }

  async updateSettings(settings: AppSettings): Promise<void> {
    const docRef = doc(this.firestore, this.SETTINGS_COLLECTION, this.CONFIG_DOC_ID);
    await setDoc(docRef, settings, { merge: true });
    this.settings.set(settings);
    this.titleService.setTitle(settings.appName);
  }

  private getDefaultSettings(): AppSettings {
    return {
      appName: 'Found Again',
      contactEmail: 'contact@found-again.com',
      maintenanceMode: false,
      allowRegistration: true,
      maxUploadSize: 5,
      itemsPerPage: 10
    };
  }
}
