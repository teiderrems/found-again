// found-object-declaration.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DeclarationComponent, DeclarationType } from '../components/declaration/declaration.component';

@Component({
  selector: 'app-found-object-declaration',
  templateUrl: './found-object.component.html',
  styleUrls: ['./found-object.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,DeclarationComponent]
})
export class FoundObjectComponent {
  DeclarationType=DeclarationType
}