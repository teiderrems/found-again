import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SubscriptionPlanDetails } from '@/types/subscription';

export interface PaymentDialogData {
  plan: SubscriptionPlanDetails;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  paymentMethod?: PaymentMethod;
  error?: string;
}

type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';
type PaymentMethod = 'card' | 'sepa' | 'paypal';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="payment-dialog bg-white dark:bg-gray-800 rounded-2xl overflow-hidden max-w-md w-full shadow-xl transition-colors duration-300">
      
      <!-- Payment Form State -->
      @if (!isProcessing() && !paymentComplete()) {
        <!-- Header with amount -->
        <div class="bg-linear-to-r from-yellow-400 to-orange-500 p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <mat-icon style="font-size: 24px; width: 24px; height: 24px;">star</mat-icon>
              <span class="text-sm font-medium opacity-90">Abonnement Premium</span>
            </div>
            <button 
              (click)="onCancel()" 
              class="p-1 rounded-full hover:bg-white/20 transition-colors">
              <mat-icon class="text-white/80 hover:text-white">close</mat-icon>
            </button>
          </div>
          <div class="text-3xl font-bold">{{ formatPrice(data.plan.price) }}</div>
          <div class="text-sm opacity-75 mt-1">{{ data.plan.name }} - {{ data.plan.id === 'premium_monthly' ? 'Mensuel' : 'Annuel' }}</div>
        </div>

        <!-- Payment Method Tabs -->
        <div class="border-b border-gray-200 dark:border-gray-700">
          <div class="flex">
            <button 
              type="button"
              (click)="selectPaymentMethod('card')"
              [class]="selectedMethod() === 'card' ? 'flex-1 py-3 px-4 text-sm font-medium border-b-2 border-[#FC4E00] text-[#FC4E00] bg-orange-50 dark:bg-orange-900/20' : 'flex-1 py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'">
              <div class="flex items-center justify-center gap-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">credit_card</mat-icon>
                <span>Carte</span>
              </div>
            </button>
            <button 
              type="button"
              (click)="selectPaymentMethod('sepa')"
              [class]="selectedMethod() === 'sepa' ? 'flex-1 py-3 px-4 text-sm font-medium border-b-2 border-[#FC4E00] text-[#FC4E00] bg-orange-50 dark:bg-orange-900/20' : 'flex-1 py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'">
              <div class="flex items-center justify-center gap-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">account_balance</mat-icon>
                <span>SEPA</span>
              </div>
            </button>
            <button 
              type="button"
              (click)="selectPaymentMethod('paypal')"
              [class]="selectedMethod() === 'paypal' ? 'flex-1 py-3 px-4 text-sm font-medium border-b-2 border-[#FC4E00] text-[#FC4E00] bg-orange-50 dark:bg-orange-900/20' : 'flex-1 py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'">
              <div class="flex items-center justify-center gap-2">
                <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" class="h-4 w-4" />
                <span>PayPal</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Card Payment Form -->
        @if (selectedMethod() === 'card') {
          <form [formGroup]="cardForm" (ngSubmit)="processCardPayment()" class="p-6 space-y-4">
            <!-- Card Number -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Numéro de carte
              </label>
              <div class="relative">
                <input
                  type="text"
                  formControlName="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  maxlength="19"
                  (input)="formatCardNumber($event)"
                  class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 pr-16"
                />
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                  @switch (detectedCardType()) {
                    @case ('visa') {
                      <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" class="h-6" />
                    }
                    @case ('mastercard') {
                      <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" class="h-6" />
                    }
                    @case ('amex') {
                      <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="Amex" class="h-6" />
                    }
                    @default {
                      <div class="flex gap-1">
                        <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" class="h-5 opacity-40" />
                        <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" class="h-5 opacity-40" />
                      </div>
                    }
                  }
                </div>
              </div>
              @if (cardForm.get('cardNumber')?.invalid && cardForm.get('cardNumber')?.touched) {
                <p class="text-red-500 text-xs mt-1">Numéro de carte invalide</p>
              }
            </div>
            
            <!-- Expiry and CVC Row -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date d'expiration
                </label>
                <input
                  type="text"
                  formControlName="expiryDate"
                  placeholder="MM / AA"
                  maxlength="7"
                  (input)="formatExpiryDate($event)"
                  class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
                @if (cardForm.get('expiryDate')?.invalid && cardForm.get('expiryDate')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Format invalide</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CVC
                </label>
                <input
                  type="text"
                  formControlName="cvv"
                  placeholder="123"
                  maxlength="4"
                  (input)="formatCVC($event)"
                  class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
                @if (cardForm.get('cvv')?.invalid && cardForm.get('cvv')?.touched) {
                  <p class="text-red-500 text-xs mt-1">CVC requis</p>
                }
              </div>
            </div>

            <!-- Cardholder Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom sur la carte
              </label>
              <input
                type="text"
                formControlName="cardholderName"
                placeholder="Jean Dupont"
                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              @if (cardForm.get('cardholderName')?.invalid && cardForm.get('cardholderName')?.touched) {
                <p class="text-red-500 text-xs mt-1">Le nom est requis</p>
              }
            </div>

            <!-- Test Mode Banner -->
            <div class="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
              <div class="flex items-start gap-2">
                <mat-icon class="text-amber-600 dark:text-amber-400" style="font-size: 18px; width: 18px; height: 18px;">science</mat-icon>
                <div class="text-xs">
                  <p class="font-medium text-amber-800 dark:text-amber-300">Mode test</p>
                  <p class="text-amber-700 dark:text-amber-400">
                    Carte test: <code class="bg-amber-100 dark:bg-amber-800 px-1 rounded">4242 4242 4242 4242</code>
                  </p>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              [disabled]="cardForm.invalid"
              class="w-full bg-[#FC4E00] hover:bg-[#d94300] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg shadow-sm transition duration-200 flex items-center justify-center gap-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">lock</mat-icon>
              Payer {{ formatPrice(data.plan.price) }}
            </button>
          </form>
        }

        <!-- SEPA Payment Form -->
        @if (selectedMethod() === 'sepa') {
          <form [formGroup]="sepaForm" (ngSubmit)="processSepaPayment()" class="p-6 space-y-4">
            <!-- IBAN -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                IBAN
              </label>
              <div class="relative">
                <input
                  type="text"
                  formControlName="iban"
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                  (input)="formatIBAN($event)"
                  class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm uppercase pr-16"
                />
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold tracking-tight">SEPA</span>
                </div>
              </div>
              @if (sepaForm.get('iban')?.invalid && sepaForm.get('iban')?.touched) {
                <p class="text-red-500 text-xs mt-1">IBAN invalide</p>
              }
            </div>

            <!-- Account Holder Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titulaire du compte
              </label>
              <input
                type="text"
                formControlName="accountHolder"
                placeholder="Jean Dupont"
                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              @if (sepaForm.get('accountHolder')?.invalid && sepaForm.get('accountHolder')?.touched) {
                <p class="text-red-500 text-xs mt-1">Le nom est requis</p>
              }
            </div>

            <!-- Email for mandate -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email (pour le mandat)
              </label>
              <input
                type="email"
                formControlName="email"
                placeholder="jean.dupont&#64;example.com"
                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              @if (sepaForm.get('email')?.invalid && sepaForm.get('email')?.touched) {
                <p class="text-red-500 text-xs mt-1">Email invalide</p>
              }
            </div>

            <!-- SEPA Mandate Info -->
            <div class="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div class="flex items-start gap-2">
                <mat-icon class="text-blue-600 dark:text-blue-400" style="font-size: 18px; width: 18px; height: 18px;">info</mat-icon>
                <p class="text-xs text-blue-700 dark:text-blue-300">
                  En validant ce paiement, vous autorisez Found à envoyer des instructions à votre banque pour débiter votre compte.
                </p>
              </div>
            </div>

            <!-- Test Mode Banner -->
            <div class="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
              <div class="flex items-start gap-2">
                <mat-icon class="text-amber-600 dark:text-amber-400" style="font-size: 18px; width: 18px; height: 18px;">science</mat-icon>
                <div class="text-xs">
                  <p class="font-medium text-amber-800 dark:text-amber-300">Mode test</p>
                  <p class="text-amber-700 dark:text-amber-400">
                    IBAN test: <code class="bg-amber-100 dark:bg-amber-800 px-1 rounded">FR76 3000 6000 0112 3456 7890 189</code>
                  </p>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              [disabled]="sepaForm.invalid"
              class="w-full bg-[#FC4E00] hover:bg-[#d94300] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg shadow-sm transition duration-200 flex items-center justify-center gap-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">account_balance</mat-icon>
              Autoriser le prélèvement
            </button>
          </form>
        }

        <!-- PayPal Payment -->
        @if (selectedMethod() === 'paypal') {
          <div class="p-6 space-y-4">
            <div class="text-center">
              <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" alt="PayPal" class="h-14 mx-auto mb-4" />
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Vous allez être redirigé vers PayPal pour finaliser votre paiement en toute sécurité.
              </p>
            </div>

            <!-- PayPal Benefits -->
            <div class="space-y-2">
              <div class="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <mat-icon class="text-green-500" style="font-size: 18px; width: 18px; height: 18px;">check_circle</mat-icon>
                <span>Protection des achats PayPal</span>
              </div>
              <div class="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <mat-icon class="text-green-500" style="font-size: 18px; width: 18px; height: 18px;">check_circle</mat-icon>
                <span>Paiement rapide et sécurisé</span>
              </div>
              <div class="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <mat-icon class="text-green-500" style="font-size: 18px; width: 18px; height: 18px;">check_circle</mat-icon>
                <span>Pas besoin de partager vos données bancaires</span>
              </div>
            </div>

            <!-- Test Mode Banner -->
            <div class="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
              <div class="flex items-center gap-2">
                <mat-icon class="text-amber-600 dark:text-amber-400" style="font-size: 18px; width: 18px; height: 18px;">science</mat-icon>
                <p class="text-xs font-medium text-amber-800 dark:text-amber-300">Mode test - Aucune redirection réelle</p>
              </div>
            </div>

            <!-- PayPal Button -->
            <button 
              type="button"
              (click)="processPayPalPayment()"
              class="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold py-2.5 rounded-lg shadow-sm transition duration-200 flex items-center justify-center gap-2">
              <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" class="h-5 w-5" />
              Payer avec PayPal
            </button>
          </div>
        }

        <!-- Footer -->
        <div class="px-6 pb-4">
          <div class="flex items-center justify-center gap-2 text-xs text-gray-400">
            <mat-icon style="font-size: 14px; width: 14px; height: 14px;">lock</mat-icon>
            <span>Paiement sécurisé • Propulsé par <strong class="text-gray-500">Found</strong></span>
          </div>
        </div>
      }

      <!-- Processing State -->
      @if (isProcessing()) {
        <div class="p-12 text-center">
          <div class="relative w-20 h-20 mx-auto mb-6">
            <mat-spinner diameter="80" class="mx-auto"></mat-spinner>
            <div class="absolute inset-0 flex items-center justify-center">
              @switch (selectedMethod()) {
                @case ('card') {
                  <mat-icon class="text-[#FC4E00]" style="font-size: 28px; width: 28px; height: 28px;">credit_card</mat-icon>
                }
                @case ('sepa') {
                  <mat-icon class="text-[#FC4E00]" style="font-size: 28px; width: 28px; height: 28px;">account_balance</mat-icon>
                }
                @case ('paypal') {
                  <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" class="h-7 w-7" />
                }
              }
            </div>
          </div>
          <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">{{ processingMessage() }}</p>
          <div class="w-48 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
            <div 
              class="bg-linear-to-r from-yellow-400 to-orange-500 h-1.5 rounded-full transition-all duration-500" 
              [style.width.%]="processingProgress()">
            </div>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Ne fermez pas cette fenêtre</p>
        </div>
      }

      <!-- Payment Success -->
      @if (paymentComplete() && paymentSuccess()) {
        <div class="p-8 text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-linear-to-r from-yellow-400 to-orange-500 flex items-center justify-center animate-bounce-once">
            <mat-icon class="text-white" style="font-size: 48px; width: 48px; height: 48px;">check</mat-icon>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Paiement réussi !</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            Merci pour votre achat. Votre abonnement <strong>{{ data.plan.name }}</strong> est maintenant actif.
          </p>
          
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="text-left">
                <p class="text-gray-500 dark:text-gray-400">Montant payé</p>
                <p class="font-semibold text-gray-900 dark:text-white">{{ formatPrice(data.plan.price) }}</p>
              </div>
              <div class="text-left">
                <p class="text-gray-500 dark:text-gray-400">Méthode</p>
                <p class="font-semibold text-gray-900 dark:text-white">{{ getMethodLabel() }}</p>
              </div>
              <div class="col-span-2 text-left">
                <p class="text-gray-500 dark:text-gray-400">Transaction</p>
                <p class="font-mono text-xs text-gray-900 dark:text-white">{{ transactionId() }}</p>
              </div>
            </div>
          </div>
          
          <button 
            (click)="onSuccess()"
            class="w-full bg-[#FC4E00] hover:bg-[#d94300] text-white font-semibold py-2.5 rounded-lg shadow-sm transition duration-200">
            Terminé
          </button>
        </div>
      }

      <!-- Payment Failed -->
      @if (paymentComplete() && !paymentSuccess()) {
        <div class="p-8 text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
            <mat-icon class="text-red-600 dark:text-red-400" style="font-size: 48px; width: 48px; height: 48px;">error</mat-icon>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Paiement refusé</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            {{ errorMessage() }}
          </p>
          <div class="flex gap-3">
            <button 
              (click)="resetForm()"
              class="flex-1 bg-[#FC4E00] hover:bg-[#d94300] text-white font-semibold py-2.5 rounded-lg shadow-sm transition duration-200">
              Réessayer
            </button>
            <button 
              (click)="onCancel()"
              class="flex-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2.5 rounded-lg transition-colors">
              Annuler
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .payment-dialog {
      min-width: 400px;
      max-width: 440px;
    }

    @media (max-width: 600px) {
      .payment-dialog {
        min-width: 100%;
        max-width: 100%;
        border-radius: 1rem 1rem 0 0;
      }
    }

    ::ng-deep .mat-mdc-dialog-container {
      padding: 0 !important;
      background: transparent !important;
    }

    ::ng-deep .mat-mdc-progress-spinner circle {
      stroke: #FC4E00 !important;
    }

    @keyframes bounce-once {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    .animate-bounce-once {
      animation: bounce-once 0.5s ease-out;
    }
  `]
})
export class PaymentDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PaymentDialogComponent>);
  data: PaymentDialogData = inject(MAT_DIALOG_DATA);

  // State signals
  selectedMethod = signal<PaymentMethod>('card');
  isProcessing = signal(false);
  paymentComplete = signal(false);
  paymentSuccess = signal(false);
  processingMessage = signal('');
  processingProgress = signal(0);
  transactionId = signal('');
  errorMessage = signal('');
  cardNumber = signal('');

  // Card Form
  cardForm: FormGroup;
  
  // SEPA Form
  sepaForm: FormGroup;

  // Computed signal pour détecter le type de carte
  detectedCardType = computed<CardType>(() => {
    const number = this.cardNumber().replace(/\s/g, '');
    if (!number) return 'unknown';
    
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6(?:011|5|4[4-9])/.test(number)) return 'discover';
    
    return 'unknown';
  });

  constructor() {
    // Card form
    this.cardForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/)]],
      expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      cardholderName: ['', [Validators.required, Validators.minLength(2)]]
    });

    // SEPA form
    this.sepaForm = this.fb.group({
      iban: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}\d{2}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{0,3}$/)]],
      accountHolder: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedMethod.set(method);
  }

  // Card formatting methods
  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\s/g, '').replace(/\D/g, '');
    value = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = value.substring(0, 19);
    this.cardForm.patchValue({ cardNumber: input.value });
    this.cardNumber.set(input.value);
  }

  formatExpiryDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + ' / ' + value.substring(2, 4);
    }
    input.value = value;
    this.cardForm.patchValue({ expiryDate: input.value });
  }

  formatCVC(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    input.value = value.substring(0, 4);
    this.cardForm.patchValue({ cvv: input.value });
  }

  // SEPA formatting
  formatIBAN(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\s/g, '').toUpperCase();
    value = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = value.substring(0, 34);
    this.sepaForm.patchValue({ iban: input.value });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  getMethodLabel(): string {
    switch (this.selectedMethod()) {
      case 'card': return 'Carte bancaire';
      case 'sepa': return 'Prélèvement SEPA';
      case 'paypal': return 'PayPal';
      default: return '';
    }
  }

  // Payment processing methods
  async processCardPayment(): Promise<void> {
    if (this.cardForm.invalid) return;
    
    const messages = [
      'Vérification de la carte...',
      'Connexion sécurisée...',
      'Autorisation bancaire...',
      'Finalisation...'
    ];
    
    await this.processPayment(messages, () => {
      const cardNumber = this.cardForm.get('cardNumber')?.value.replace(/\s/g, '');
      return !cardNumber.startsWith('4000');
    });
  }

  async processSepaPayment(): Promise<void> {
    if (this.sepaForm.invalid) return;
    
    const messages = [
      'Vérification IBAN...',
      'Création du mandat...',
      'Validation bancaire...',
      'Confirmation du prélèvement...'
    ];
    
    await this.processPayment(messages, () => {
      const iban = this.sepaForm.get('iban')?.value.replace(/\s/g, '');
      return iban.startsWith('FR76') || iban.startsWith('DE89');
    });
  }

  async processPayPalPayment(): Promise<void> {
    const messages = [
      'Connexion à PayPal...',
      'Authentification...',
      'Traitement du paiement...',
      'Confirmation...'
    ];
    
    await this.processPayment(messages, () => true);
  }

  private async processPayment(messages: string[], isSuccessCheck: () => boolean): Promise<void> {
    this.isProcessing.set(true);
    this.processingProgress.set(0);

    for (let i = 0; i < messages.length; i++) {
      this.processingMessage.set(messages[i]);
      this.processingProgress.set((i + 1) * 25);
      await this.delay(600 + Math.random() * 400);
    }

    await this.delay(300);

    this.isProcessing.set(false);
    this.paymentComplete.set(true);

    if (isSuccessCheck()) {
      this.paymentSuccess.set(true);
      this.transactionId.set(this.generateTransactionId());
    } else {
      this.paymentSuccess.set(false);
      this.errorMessage.set('Le paiement a été refusé. Veuillez vérifier vos informations ou utiliser une autre méthode de paiement.');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateTransactionId(): string {
    const prefix = this.selectedMethod() === 'sepa' ? 'sxn_' : 
                   this.selectedMethod() === 'paypal' ? 'pp_' : 'pi_';
    return prefix + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
  }

  resetForm(): void {
    this.cardForm.reset();
    this.sepaForm.reset();
    this.cardNumber.set('');
    this.paymentComplete.set(false);
    this.paymentSuccess.set(false);
    this.errorMessage.set('');
  }

  onSuccess(): void {
    this.dialogRef.close({
      success: true,
      transactionId: this.transactionId(),
      paymentMethod: this.selectedMethod()
    } as PaymentResult);
  }

  onCancel(): void {
    this.dialogRef.close({
      success: false,
      error: 'cancelled'
    } as PaymentResult);
  }
}
