import { Component, OnInit, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
   selector: 'app-search-field',
   templateUrl: './search-field.component.html',
   styleUrl: './search-field.component.css',
   standalone: true,
   imports:[ReactiveFormsModule]
})
export class SearchFieldComponent implements OnInit {
   searchControl = new FormControl('');

   query = output<string | null>();

   ngOnInit() {
      this.searchControl.valueChanges
         .pipe(
            debounceTime(100), // Attend 100ms que l'utilisateur arrête de taper (optimisation)
            distinctUntilChanged(), // Évite de chercher 2 fois la même chose
         )
         .subscribe((searchTerm) => {
            this.query.emit(searchTerm);
         });
   }
}
