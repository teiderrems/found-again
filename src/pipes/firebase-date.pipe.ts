import { Pipe, PipeTransform, Inject, LOCALE_ID } from '@angular/core';
import { formatDate } from '@angular/common';

@Pipe({
  name: 'firebaseDate',
  standalone: true,
})
export class FirebaseDatePipe implements PipeTransform {
  constructor(@Inject(LOCALE_ID) private locale: string) {}

  transform(value: any, format: string = 'mediumDate'): string {
    if (!value) return '';

    let date: Date;

    // Vérifier si c'est un Timestamp Firestore (utilise duck typing pour éviter l'import)
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
      date = value.toDate();
    }
    // Vérifier si c'est déjà une Date
    else if (value instanceof Date) {
      date = value;
    }
    // Vérifier si c'est un nombre (timestamp en ms)
    else if (typeof value === 'number') {
      date = new Date(value);
    }
    // Vérifier si c'est une chaîne
    else if (typeof value === 'string') {
      date = new Date(value);
    } else {
      return '';
    }

    try {
      return formatDate(date, format, this.locale);
    } catch (error) {
      console.warn('FirebaseDatePipe: Error formatting date', error);
      return date.toString();
    }
  }
}

