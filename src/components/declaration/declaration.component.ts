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
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@/services/auth.service';
import { CategoryService } from '@/services/category.service';
import { LocationService, LocationSuggestion } from '@/services/location.service';
import { DefaultCategory } from '@/constants/categories.constants';
import { CategorySelectorComponent } from '../category-selector.component';
import { DeclarationCreate, DeclarationType } from '@/types/declaration';

@Component({
   selector: 'app-declaration',
   templateUrl: './declaration.component.html',
   styleUrls: ['./declaration.component.css'],
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, CategorySelectorComponent],
})
export class DeclarationComponent implements OnInit {
   
   @Input() declarationType: DeclarationType = DeclarationType.FOUND;
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
         mainTitle: 'Signaler une perte',
         objectLabel: 'Objet perdu',
         locationLabel: 'Lieu de perte',
         dateLabel: 'Date de perte',
         descriptionPlaceholder:
            "Décrivez l'objet perdu en détail (couleur, marque, dimensions, contenu, etc.)",
         submitButton: 'Signaler la perte',
         illustrationTitle: 'Vous avez perdu un objet ?',
         illustrationText:
            'Ne perdez pas espoir ! Déclarez votre perte pour augmenter vos chances de le retrouver.',
         successMessage: 'Votre déclaration de perte a été enregistrée avec succès!',
      },
      [DeclarationType.FOUND]: {
         title: 'Déclarer un objet retrouvé',
         mainTitle: 'Déclarer un objet retrouvé',
         objectLabel: 'Objet retrouvé',
         locationLabel: 'Lieu de trouvaille',
         dateLabel: 'Date de trouvaille',
         descriptionPlaceholder:
            "Décrivez l'objet retrouvé en détail (couleur, marque, dimensions, contenu, etc.)",
         submitButton: "Déclarer l'objet retrouvé",
         illustrationTitle: 'Aidez à retrouver son propriétaire',
         illustrationText:
            "Votre déclaration peut faire la différence pour quelqu'un qui a perdu un objet précieux",
         successMessage: 'Votre déclaration a été enregistrée avec succès!',
      },
   };
   private categoryService = inject(CategoryService);
   private authService = inject(AuthService);
   private locationService = inject(LocationService);
   private fb = inject(FormBuilder);

   selectedCategory: string = '';
   categories = signal<DefaultCategory[]>([]);

   isDragOver = signal(false);

   constructor() {
      this.declarationForm = this.fb.group({
         title: ['', [Validators.required, Validators.minLength(3)]],
         category: ['', Validators.required],
         description: ['', [Validators.required, Validators.minLength(10)]],
         location: ['', Validators.required],
         date: ['', Validators.required],
         contactEmail: ['', [Validators.required, Validators.email]],
         contactPhone: ['', [Validators.pattern('^[0-9]{10}$')]],
      });
   }

   ngOnInit() {
      this.categoryService.getCategories().subscribe((categories) => {
         this.categories.set(categories);
      });

      
      this.declarationForm.get('location')?.valueChanges.subscribe((value) => {
         this.onLocationInputChange(value);
      });
   }

   onCategorySelected(categoryId: string): void {
      this.selectedCategory = categoryId;
      this.declarationForm.patchValue({ category: categoryId });
      console.log('Catégorie sélectionnée:', categoryId);
   }

   get currentTexts() {
      return this.texts[this.declarationType];
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
      if (files.length > 0) {
         for (let i = 0; i < files.length; i++) {
            const file = files[i];
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
            coordinates: this.selectedCoordinates,
            images: this.selectedFiles,
            type:this.declarationType
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
