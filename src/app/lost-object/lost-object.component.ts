import { Component } from '@angular/core';
import { DeclarationComponent} from '../components/declaration/declaration.component';
import { DeclarationCreate, DeclarationType } from '../types/declaration';

@Component({
  selector: 'app-lost-object',
  templateUrl: './lost-object.component.html',
  styleUrl: './lost-object.component.css',
  standalone:true,
  imports:[DeclarationComponent]
})
export class LostObjectComponent {
  DeclarationType=DeclarationType
  
  
  handleSubmit($event: DeclarationCreate) {
    console.log($event);
  }
}
