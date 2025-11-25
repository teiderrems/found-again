import { Component, ElementRef, TemplateRef, viewChild } from '@angular/core';

@Component({
  selector: 'app-found-object',
  templateUrl: './found-object.component.html',
  styleUrl: './found-object.component.css',
  standalone:true
})
export class FoundObjectComponent {
  
  
  inputFragment = viewChild<ElementRef>('input');
  handleClic() {
    this.inputFragment
  }
}
