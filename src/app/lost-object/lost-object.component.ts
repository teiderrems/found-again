import { Component } from '@angular/core';
import { DeclarationComponent, DeclarationType } from '../components/declaration/declaration.component';

@Component({
  selector: 'app-lost-object',
  templateUrl: './lost-object.component.html',
  styleUrl: './lost-object.component.css',
  standalone:true,
  imports:[DeclarationComponent]
})
export class LostObjectComponent {
  DeclarationType=DeclarationType
}
