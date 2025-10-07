import { Component, inject, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { commercial_modes as Commercial, CustomType } from '@/app/interfaces/dtos/api';
import { AuthService } from '@/app/auth/auth.service';
import { ApiServiceService } from '@/app/api-service.service';
import { Router } from '@angular/router';
import { HistoricService } from '@/app/statistique/statistique.service';
import { Auth, user, User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent  implements  OnDestroy {

  @ViewChild(TemplateRef) button: TemplateRef<unknown> | undefined;

  constructor(
    private readonly authService: AuthService,
    private readonly apiService: ApiServiceService,
    private readonly router: Router,
    private readonly hisService: HistoricService,
  ) {
    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
      this.email = aUser?.email;
    });
  }
  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }

  private auth: Auth = inject(Auth);
  user$ = user(this.auth);
  userSubscription: Subscription;

  email: string | null | undefined = 'inconnu';

  trajets2: CustomType[] = [];

  regions: Commercial[] = [];
  get getUrl(): string {
    return this.router.url;
  }

  async logOut() {
    try {
      await this.authService.logOut();
      this.router.navigateByUrl('/login');
    } catch (error) {
      console.log(error);
    }
  }

}
