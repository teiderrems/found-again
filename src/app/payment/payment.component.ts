import { Component, inject, OnInit } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
   import { MatSnackBar } from '@angular/material/snack-bar';
 import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent  implements OnInit {

  amount: number ;
  tax: number ;
  productName: string ;

  private _snackBar = inject(MatSnackBar);

  private formBuilder = inject(NonNullableFormBuilder);
  private activatedRoute = inject(ActivatedRoute);
  constructor(private readonly router:Router) {
    this.amount=0;
    this.productName="";
    this.tax=0;
  }
  get totalAmount():number{
    return this.amount+this.tax;
  }
  ngOnInit() {
     this.activatedRoute.queryParams.subscribe(params => {
      this.amount=Number( params?.['amount'] ??0);
      this.productName= params?.['product'];
      this.tax= this.amount * 0.2 ;
    })
  }
    form = this.formBuilder.group({
      email: this.formBuilder.control('', [Validators.required,Validators.email]),
      fullName: this.formBuilder.control('', [Validators.required,Validators.maxLength(200)]),
      cardNumber:this.formBuilder.control(4242424242424242,[Validators.required,Validators.minLength(16),Validators.maxLength(16)]),
      expirationDate:this.formBuilder.control(44/44,[Validators.required,]),
      cvc:this.formBuilder.control(333,[Validators.required,Validators.pattern("^[0-9]{3}$")]),
      address:this.formBuilder.control(null,[Validators.required,Validators.minLength(5),Validators.maxLength(50)]),
    });

  get email() {
    return this.form.get('email');
  }
  get fullName() {
    return this.form.get('fullName');
  }
  get cardNumber() {
    return this.form.get('cardNumber');
  }
  get expirationDate() {
    return this.form.get('expirationDate');
  }
  get cvc() {
    return this.form.get('cvc');
  }
  get address() {
    return this.form.get('address');
  }
    onSubmit() {
      this.form.markAllAsTouched();

      if (this.form.valid) {
        //this.loading=true;

        setTimeout(()=>{
          this._snackBar.open("Merci d'avoir payé","",{
            horizontalPosition: "center",
            verticalPosition: "top",
            duration: 10000
          });
        },3000);
        this.router.navigateByUrl('/');

      }

  }
}
