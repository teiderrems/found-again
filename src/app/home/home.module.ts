import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ReservationModule } from '../reservation/reservation.module';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import {  NzTagModule } from 'ng-zorro-antd/tag';
import { IconsProviderModule } from '../icons-provider.module';
import {  MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../header/header.component';
import { NzGridModule } from 'ng-zorro-antd/grid';
import {MatStepperModule} from '@angular/material/stepper';
import {MatMenuModule} from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import {MatExpansionModule} from '@angular/material/expansion';
import { MatDialogModule } from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {MatCardModule} from '@angular/material/card';

 @NgModule({
    declarations: [HomeComponent,HeaderComponent],
    imports: [
       IconsProviderModule,
       CommonModule,
       NzModalModule,
       NzCollapseModule,
       NzButtonModule,
       RouterOutlet,
       NzBreadCrumbModule,
       RouterModule,
       ReservationModule,
       NzListModule,
       NzTypographyModule,
       MatMenuModule,
       NzTagModule,
       MatButtonModule,MatCardModule,
       MatIconModule,NzGridModule,MatStepperModule,MatExpansionModule,MatDialogModule,MatDividerModule
    ],
 })
 export class HomeModule {}
