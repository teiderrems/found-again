import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'firebaseDate',
  standalone: true,
})
export class FirebaseDatePipe implements PipeTransform {
  transform(value: any, format: string = 'short'): string {
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

    // Formatter la date selon le format demandé
    if (format === 'short') {
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } else if (format === 'long') {
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else if (format === 'time') {
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (format === 'full') {
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return date.toString();
  }
}

