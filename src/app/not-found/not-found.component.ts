import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {Pages} from "@/config/constant";

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css',
  imports:[RouterLink],
  standalone:true
})
export class NotFoundComponent {

  protected readonly Pages = Pages;
}
