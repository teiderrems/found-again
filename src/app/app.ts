import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UbButtonDirective } from "@/components/ui/button";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,UbButtonDirective],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('found-again');
}
