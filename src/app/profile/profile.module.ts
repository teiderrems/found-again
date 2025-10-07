import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ProfileComponent } from './profile.component';
import { ReactiveFormsModule } from '@angular/forms';
import {MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import { DialogComponent } from './dialog/dialog.component';
@NgModule({
  declarations: [ProfileComponent, DialogComponent],
  imports: [
    CommonModule,
    NzButtonModule,
    ReactiveFormsModule,
    MatDialogModule,MatButtonModule
  ]
})
export class ProfileModule { }
