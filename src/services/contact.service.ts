import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, Timestamp } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';

export interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Timestamp;
  status: 'new' | 'read' | 'replied';
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private firestore = inject(Firestore);

  sendContactRequest(data: Omit<ContactRequest, 'createdAt' | 'status'>): Observable<string> {
    const contactCollection = collection(this.firestore, 'contact_requests');
    const request: ContactRequest = {
      ...data,
      createdAt: Timestamp.now(),
      status: 'new'
    };
    return from(addDoc(contactCollection, request).then(ref => ref.id));
  }
}
