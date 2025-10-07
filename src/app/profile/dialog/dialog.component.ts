import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.css'
})
export class DialogComponent {
  constructor(){}
  @Input() message:string="Voulez-vous vraiment supprimer cet itinéraire?";
  @Input() title:string="Supprimer itinéraire";
  handleOk(){
    this.ok.emit(true);
    console.log("oui");
  }

  @Output() ok:EventEmitter<boolean>=new EventEmitter();
  handleCancel(){
    console.log("non");
    this.ok.emit(false);
  }
}
