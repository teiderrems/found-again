import {
   Component,
   Input,
   Output,
   EventEmitter,
   inject,
   OnInit,
   signal,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@/services/auth.service';
import { CategoryService } from '@/services/category.service';
import { LocationService, LocationSuggestion } from '@/services/location.service';
import { DefaultCategory } from '@/constants/categories.constants';
import { CategorySelectorComponent } from '../category-selector.component';
import { DeclarationCreate, DeclarationType, ObjectCondition, DeclarationData } from '@/types/declaration';
import { SettingsService } from '@/services/settings.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
   selector: 'app-declaration',
   templateUrl: './declaration.component.html',
   styleUrls: ['./declaration.component.css'],
   standalone: true,
   imports: [ReactiveFormsModule, CategorySelectorComponent],
})
export class DeclarationComponent implements OnInit {
   
   @Input() declarationType: DeclarationType = DeclarationType.FOUND;
   @Input() isEditMode: boolean = false;
   @Input() existingDeclaration: DeclarationData | null = null;
   @Output() declarationSubmit = new EventEmitter<DeclarationCreate>();

   DeclarationType = DeclarationType;

   declarationForm: FormGroup;
   selectedFiles: File[] = [];
   imagePreviews: string[] = [];

   locationSuggestions = signal<LocationSuggestion[]>([]);
   isGettingCurrentLocation = signal(false);
   showSuggestioLocation = signal(false);
   selectedCoordinates?: { lat: number; lng: number };
   selectedCoordinatesString?: string;

   texts = {
      [DeclarationType.LOSS]: {
         title: 'Déclarer un objet perdu',
         editTitle: 'Modifier la déclaration d\'objet perdu',
         mainTitle: 'Signaler une perte',
         editMainTitle: 'Modifier votre déclaration',
         objectLabel: 'Objet perdu',
         locationLabel: 'Lieu de perte',
         dateLabel: 'Date de perte',
         descriptionPlaceholder:
            "Décrivez l'objet perdu en détail (couleur, marque, dimensions, contenu, etc.)",
         submitButton: 'Signaler la perte',
         editSubmitButton: 'Mettre à jour la déclaration',
         illustrationTitle: 'Vous avez perdu un objet ?',
         illustrationText:
            'Ne perdez pas espoir ! Déclarez votre perte pour augmenter vos chances de le retrouver.',
         successMessage: 'Votre déclaration de perte a été enregistrée avec succès!',
         editSuccessMessage: 'Votre déclaration de perte a été mise à jour avec succès!',
      },
      [DeclarationType.FOUND]: {
         title: 'Déclarer un objet retrouvé',
         editTitle: 'Modifier la déclaration d\'objet retrouvé',
         mainTitle: 'Déclarer un objet retrouvé',
         editMainTitle: 'Modifier votre déclaration',
         objectLabel: 'Objet retrouvé',
         locationLabel: 'Lieu de trouvaille',
         dateLabel: 'Date de trouvaille',
         descriptionPlaceholder:
            "Décrivez l'objet retrouvé en détail (couleur, marque, dimensions, contenu, etc.)",
         submitButton: "Déclarer l'objet retrouvé",
         editSubmitButton: 'Mettre à jour la déclaration',
         illustrationTitle: 'Aidez à retrouver son propriétaire',
         illustrationText:
            "Votre déclaration peut faire la différence pour quelqu'un qui a perdu un objet précieux",
         successMessage: 'Votre déclaration a été enregistrée avec succès!',
         editSuccessMessage: 'Votre déclaration a été mise à jour avec succès!',
      },
   };
   private categoryService = inject(CategoryService);
   private authService = inject(AuthService);
   private locationService = inject(LocationService);
   private fb = inject(FormBuilder);
   private settingsService = inject(SettingsService);
   private snackBar = inject(MatSnackBar);

   selectedCategory: string = '';
   categories = signal<DefaultCategory[]>([]);

   isDragOver = signal(false);

   // Options pour l'état de l'objet
   ObjectCondition = ObjectCondition;
   conditionOptions = [
      { value: ObjectCondition.EXCELLENT, label: 'Excellent', icon: '⭐', description: 'Comme neuf, aucun défaut visible' },
      { value: ObjectCondition.GOOD, label: 'Bon', icon: '👍', description: 'Légères traces d\'usure' },
      { value: ObjectCondition.FAIR, label: 'Correct', icon: '👌', description: 'Usure visible mais fonctionnel' },
      { value: ObjectCondition.POOR, label: 'Mauvais', icon: '👎', description: 'Très usé ou endommagé' },
      { value: ObjectCondition.UNKNOWN, label: 'Inconnu', icon: '❓', description: 'État non déterminé' },
   ];

   constructor() {
      this.declarationForm = this.fb.group({
         title: ['', [Validators.required, Validators.minLength(3)]],
         category: ['', Validators.required],
         description: ['', [Validators.required, Validators.minLength(10)]],
         location: ['', Validators.required],
         date: ['', Validators.required],
         contactEmail: [this.authService.getCurrentUserEmail() || '', [Validators.required, Validators.email]],
         contactPhone: ['', [Validators.pattern('^[0-9]{10}$')]],
         condition: [ObjectCondition.UNKNOWN],
      });
   }

   ngOnInit() {
      this.categoryService.getCategories().subscribe((categories) => {
         this.categories.set(categories);
      });

      // Gérer le mode édition
      if (this.isEditMode && this.existingDeclaration) {
         this.populateFormForEdit();
      }
      
      this.declarationForm.get('location')?.valueChanges.subscribe((value) => {
         this.onLocationInputChange(value);
      });
   }

   private populateFormForEdit(): void {
      if (!this.existingDeclaration) return;

      const declaration = this.existingDeclaration;
      
      // Pré-remplir le formulaire avec les données existantes
      this.declarationForm.patchValue({
         title: declaration.title,
         category: declaration.category,
         description: declaration.description,
         location: declaration.location,
         date: declaration.date,
         contactEmail: declaration.contactEmail || '',
         contactPhone: declaration.contactPhone || '',
         condition: declaration.condition || ObjectCondition.UNKNOWN,
      });

      // Définir la catégorie sélectionnée
      this.selectedCategory = declaration.category;

      // Charger les images existantes
      if (declaration.images && declaration.images.length > 0) {
         this.imagePreviews = declaration.images.map(img => img.downloadURL);
         // Note: Les fichiers originaux ne sont pas disponibles en édition
         // L'utilisateur devra uploader de nouvelles images s'il veut les changer
      }

      // Définir les coordonnées si disponibles
      if (declaration.coordinates) {
         this.selectedCoordinates = declaration.coordinates;
         this.selectedCoordinatesString = `${declaration.coordinates.lat}, ${declaration.coordinates.lng}`;
      }
   }

   onCategorySelected(categoryId: string): void {
      this.selectedCategory = categoryId;
      this.declarationForm.patchValue({ category: categoryId });
   }

   get currentTexts() {
      const baseTexts = this.texts[this.declarationType];
      if (this.isEditMode) {
         return {
            ...baseTexts,
            title: baseTexts.editTitle || baseTexts.title,
            mainTitle: baseTexts.editMainTitle || baseTexts.mainTitle,
            submitButton: baseTexts.editSubmitButton || baseTexts.submitButton,
            successMessage: baseTexts.editSuccessMessage || baseTexts.successMessage,
         };
      }
      return baseTexts;
   }

   get illustrationColor() {
      return this.declarationType === DeclarationType.LOSS
         ? 'from-orange-50 to-amber-100'
         : 'from-blue-50 to-indigo-100';
   }

   
   onLocationInputChange(query: string): void {
      if (query && query.length > 2) {
         this.locationService.searchLocations(query).subscribe({
            next: (suggestions) => {
               this.locationSuggestions.set(suggestions);
            },
            error: (error) => {
               console.error('Erreur de recherche de lieux:', error);
               this.locationSuggestions.set([]);
            },
         });
      } else {
         this.locationSuggestions.set([]);
      }
   }

   selectLocationSuggestion(suggestion: LocationSuggestion): void {
      this.declarationForm.patchValue({
         location: suggestion.display_name,
      });
      this.selectedCoordinates = {
         lat: parseFloat(suggestion.lat),
         lng: parseFloat(suggestion.lon),
      };
      this.locationSuggestions.set([]);
   }

   useCurrentLocation(): void {
      this.isGettingCurrentLocation.set(true);

      this.locationService.getCurrentPosition().subscribe({
         next: (position) => {
            this.locationService
               .getAddressFromCoordinates(position.latitude, position.longitude)
               .subscribe({
                  next: (address) => {
                     this.declarationForm.patchValue({
                        location: address,
                     });
                     this.selectedCoordinates = {
                        lat: position.latitude,
                        lng: position.longitude,
                     };
                     this.isGettingCurrentLocation.set(false);
                  },
                  error: (error) => {
                     console.error('Erreur de géocodage inverse:', error);
                     this.declarationForm.patchValue({
                        location: `Position: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`,
                     });
                     this.selectedCoordinates = {
                        lat: position.latitude,
                        lng: position.longitude,
                     };
                     this.isGettingCurrentLocation.set(false);
                  },
               });
         },
         error: (error) => {
            console.error('Erreur de géolocalisation:', error);
            this.isGettingCurrentLocation.set(false);

            let errorMessage = "Impossible d'obtenir votre position";
            if (error.code === 1) {
               errorMessage =
                  "Géolocalisation refusée. Veuillez autoriser l'accès à votre position.";
            } else if (error.code === 2) {
               errorMessage = 'Position indisponible. Vérifiez votre connexion.';
            } else if (error.code === 3) {
               errorMessage = 'Délai de localisation dépassé.';
            }

            alert(errorMessage);
         },
      });
   }

   
   onFileSelected(event: any): void {
      const files: FileList = event.target.files;
      const maxSizeBytes = this.settingsService.maxUploadSize() * 1024 * 1024;

      if (files.length > 0) {
         for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (file.size > maxSizeBytes) {
               this.snackBar.open(
                  `Le fichier ${file.name} dépasse la taille maximale autorisée de ${this.settingsService.maxUploadSize()}MB`,
                  'Fermer',
                  { duration: 5000, panelClass: ['bg-red-500', 'text-white'] }
               );
               continue;
            }

            if (file.type.startsWith('image/')) {
               this.selectedFiles.push(file);

               const reader = new FileReader();
               reader.onload = (e: any) => {
                  this.imagePreviews.push(e.target.result);
               };
               reader.readAsDataURL(file);
            }
         }
         event.target.value = '';
      }
   }

   removeImage(index: number): void {
      this.selectedFiles.splice(index, 1);
      this.imagePreviews.splice(index, 1);
   }

   triggerFileInput(): void {
      const fileInput = document.getElementById('images') as HTMLInputElement;
      fileInput.click();
   }

   
   onSubmit(): void {
      if (this.declarationForm.valid) {
         const formData: DeclarationCreate = {
            ...this.declarationForm.value,
            userId: this.authService.getCurrentUserId(),
            coordinates: this.selectedCoordinates,
            images: this.selectedFiles,
            type: this.declarationType,
            condition: this.declarationForm.value.condition || ObjectCondition.UNKNOWN
         };

         
         this.declarationSubmit.emit(formData);

         
         this.declarationForm.reset();
         this.selectedFiles = [];
         this.imagePreviews = [];
         this.selectedCoordinates = undefined;
         this.locationSuggestions.set([]);
         this.selectedCategory = '';

         
         // alert(this.currentTexts.successMessage);
      } else {
         Object.keys(this.declarationForm.controls).forEach((key) => {
            this.declarationForm.get(key)?.markAsTouched();
         });
      }
   }

   showSuggestion(){
      return this.location?.value.test(/^(?:0[1-9]|[1-8]\d|9[0-8])\d{3}$/g).length==0;
   }

   // Helper methods for validation
   get title() {
      return this.declarationForm.get('title');
   }
   get category() {
      return this.declarationForm.get('category');
   }
   get description() {
      return this.declarationForm.get('description');
   }
   get location() {
      return this.declarationForm.get('location');
   }
   get date() {
      return this.declarationForm.get('date');
   }
   get contactEmail() {
      return this.declarationForm.get('contactEmail');
   }
   get contactPhone() {
      return this.declarationForm.get('contactPhone');
   }

   // Méthode utilitaire pour formater l'adresse
   getAddressString(address: any): string {
      if (!address) return '';

      const parts = [];
      if (address.road) parts.push(address.road);
      if (address.neighbourhood) parts.push(address.neighbourhood);
      if (address.suburb) parts.push(address.suburb);
      if (address.city) parts.push(address.city);
      if (address.postcode) parts.push(address.postcode);
      this.selectedCoordinatesString=parts.join(', ');
      return this.selectedCoordinatesString;
   }

   // Drag and Drop methods
   onDragOver(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
      this.isDragOver.set(true);
   }

   onDragLeave(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
      this.isDragOver.set(false);
   }

   onDrop(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
      this.isDragOver.set(false);

      const files = event.dataTransfer?.files;
      if (files) {
         const imageFiles = Array.from(files).filter((file) =>
            file.type.startsWith('image/')
         );
         this.processFiles(imageFiles);
      }
   }

   private processFiles(files: File[]) {
      files.forEach((file) => {
         if (file.size <= 5 * 1024 * 1024) { // 5MB limit
            this.selectedFiles.push(file);
            const reader = new FileReader();
            reader.onload = (e) => {
               this.imagePreviews.push(e.target?.result as string);
            };
            reader.readAsDataURL(file);
         }
      });
   }
}
