import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DeclarationComponent } from '../components/declaration/declaration.component';
import { DeclarationCreate, DeclarationType } from '../types/declaration';

@Component({
  selector: 'app-found-object-declaration',
  templateUrl: './found-object.component.html',
  styleUrls: ['./found-object.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,DeclarationComponent]
})
export class FoundObjectComponent {
  
  DeclarationType=DeclarationType
  
  handleSubmit($event: DeclarationCreate) {
    console.log($event);
  }
}