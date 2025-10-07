import { AfterViewInit, Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { updateProfile } from 'firebase/auth';
import { Auth, updateEmail, User } from '@angular/fire/auth';
import { HistoricService } from '../statistique/statistique.service';
import { Historic } from '../interfaces/dtos/api';
import { formatDate, formatTime } from '@/config/util.date';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from './dialog/dialog.component';

@Component({
   selector: 'app-profile',
   templateUrl: './profile.component.html',
   styleUrl: './profile.component.css',
})
export class ProfileComponent implements AfterViewInit {

   handleClic($event: boolean) {
      if ($event) {
         this.deleteHistoric(this.currentHist!);
      }
   }
   profileForm: FormGroup;
   private auth: Auth = inject(Auth);
   private historicService=inject(HistoricService);
   private router:Router=inject(Router);
   private $user:User| null=null;

   currentHist:Historic|undefined;
   @ViewChild('modal') modal!:TemplateRef<DialogComponent>;

   constructor(private formBuilder: FormBuilder,private readonly dialog: MatDialog) {
      const user = this.auth.currentUser;
      this.$user=this.auth.currentUser;
      this.profileForm = formBuilder.group({
         email: [
            user?.email ?? '',
            [
               Validators.required,
               Validators.email,
               Validators.pattern(
                  '^[a-zA-Z0-9._%+-]+@(?:gmail\\.com|hotmail\\.com|outlook\\.com|yahoo\\.com|yahoo\\.fr)$',
               ),
            ],
         ],
         fullName: [
            user?.displayName ?? '',
            [Validators.required, Validators.maxLength(200)],
         ],
      });
   }

   openDialog(enterAnimationDuration: string, exitAnimationDuration: string): void {
      this.dialog.open(this.modal, {
        width: '250px',
        enterAnimationDuration,
        exitAnimationDuration,
      });
    }


   historiques:Historic[]=[];
   async ngAfterViewInit(): Promise<void> {
      try {
         const res=await this.historicService.getAllHistoric(this.$user?.email as string);
         if (!res.empty) {

            res.forEach(doc=>this.historiques=[...this.historiques,{depart:doc.data()['depart'],destination:doc.data()['destination'],id:doc.id,startDate:doc.data()['startDate'],}]);
         }
      } catch (error) {
         console.log(error);
      }
   }

   async handleSubmit() {
      this.profileForm.markAllAsTouched();

      if (this.profileForm.valid) {
         try {
            const result = await updateProfile(this.auth.currentUser as User, {
               displayName: this.fullName,
            });
            await updateEmail(
               this.auth.currentUser as User,
               this.email,
            );
            console.log(result);
         } catch (err) {
            console.log(err);
         }
      }
   }
   get email() {
      return this.profileForm.get('email')?.value;
   }
   get fullName() {
      return this.profileForm.get('fullName')?.value;
   }

   deleteHistoric(hist:Historic):void{
      this.historicService.deleteHistoric(hist)
      .then(()=>this.historiques=this.historiques.filter(h=>h.id!==hist.id))
      .catch(error=>console.log("echec de la suppression"));
   }

  protected readonly formatDate = formatDate;
  protected readonly formatTime = formatTime;
}
