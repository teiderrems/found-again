// components/contact.component.ts
import { Component, OnInit, inject, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import {Pages} from "@/config/constant";
import { SettingsService } from '@/services/settings.service';
import { ContactService } from '@/services/contact.service';

interface ContactMethod {
  type: string;
  label: string;
  value: string;
  icon: string;
  description: string;
  action?: string;
}

interface FAQItem {
  question: string;
  answer: string;
  expanded: boolean;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, MatIconModule],
  templateUrl:'./contact.component.html',
  styleUrl:'./contact.component.css'
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  isSubmitting = false;
  private settingsService = inject(SettingsService);
  private contactService = inject(ContactService);

  contactMethods: ContactMethod[] = [
    {
      type: 'email',
      label: 'Email',
      value: this.settingsService.contactEmail(),
      icon: 'email',
      description: 'Réponse sous 24h',
      action: `mailto:${this.settingsService.contactEmail()}`
    },
    {
      type: 'phone',
      label: 'Téléphone',
      value: '+33 1 23 45 67 89',
      icon: 'phone',
      description: 'Lun-Ven 9h-18h',
      action: 'tel:+33123456789'
    },
    {
      type: 'address',
      label: 'Bureau',
      value: '123 Avenue de la Solidarité',
      icon: 'location_on',
      description: '75001 Paris, France'
    },
    {
      type: 'support',
      label: 'Support technique',
      value: 'support@objets-trouves.fr',
      icon: 'support_agent',
      description: 'Assistance technique',
      action: 'mailto:support@objets-trouves.fr'
    }
  ];

  socialLinks = [
    {
      name: 'Facebook',
      icon: 'facebook',
      url: 'https://facebook.com/objets-trouves',
      color: '#1877F2'
    },
    {
      name: 'Twitter',
      icon: 'twitter',
      url: 'https://twitter.com/objets-trouves',
      color: '#1DA1F2'
    },
    {
      name: 'LinkedIn',
      icon: 'linkedin',
      url: 'https://linkedin.com/company/objets-trouves',
      color: '#0A66C2'
    },
    {
      name: 'Instagram',
      icon: 'instagram',
      url: 'https://instagram.com/objets-trouves',
      color: '#E4405F'
    }
  ];

  faqs: FAQItem[] = [
    {
      question: "Quel est le délai de réponse moyen ?",
      answer: "Nous nous engageons à répondre à tous les messages dans un délai de 24 heures ouvrées. Pour les urgences, privilégiez l'appel téléphonique.",
      expanded: false
    },
    {
      question: "Puis-je contacter l'équipe pour un partenariat ?",
      answer: "Absolument ! Nous sommes toujours ouverts aux collaborations. Utilisez le formulaire en sélectionnant 'Partenariat' comme sujet, ou contactez-nous directement par email.",
      expanded: false
    },
    {
      question: "Comment signaler un problème technique sur le site ?",
      answer: "Vous pouvez utiliser le formulaire en sélectionnant 'Problème technique' ou écrire directement à support@objets-trouves.fr. N'oubliez pas de joindre des captures d'écran si possible.",
      expanded: false
    },
    {
      question: "Proposez-vous une API pour les développeurs ?",
      answer: "Oui, nous proposons une API REST pour les développeurs souhaitant intégrer nos services. Contactez-nous pour obtenir la documentation et les clés d'API.",
      expanded: false
    },
    {
      question: "Comment devenir bénévole ou contributeur ?",
      answer: "Nous accueillons avec plaisir les personnes souhaitant contribuer au projet. Contactez-nous en précisant vos compétences et disponibilités.",
      expanded: false
    }
  ];

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
    effect(() => {
      const email = this.settingsService.contactEmail();
      this.contactMethods[0].value = email;
      this.contactMethods[0].action = `mailto:${email}`;
    });  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting = true;

      this.contactService.sendContactRequest(this.contactForm.value).subscribe({
        next: () => {
          this.isSubmitting = false;
          alert('Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.');
          this.contactForm.reset();
        },
        error: (error) => {
          console.error('Erreur lors de l\'envoi du message:', error);
          this.isSubmitting = false;
          alert('Une erreur est survenue. Veuillez réessayer plus tard.');
        }
      });
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  showError(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return 'Ce champ est obligatoire';
    }
    if (field.errors['email']) {
      return 'Format d\'email invalide';
    }
    if (field.errors['minlength']) {
      return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
    }
    if (field.errors['maxlength']) {
      return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
    }

    return 'Champ invalide';
  }

  markAllFieldsAsTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      this.contactForm.get(key)?.markAsTouched();
    });
  }

  handleContactAction(contact: ContactMethod): void {
    if (contact.action) {
      if (contact.action.startsWith('mailto:') || contact.action.startsWith('tel:')) {
        window.location.href = contact.action;
      }
    }
  }

  getContactIconColor(type: string): string {
    const colors: { [key: string]: string } = {
      email: '#3B82F6',
      phone: '#10B981',
      address: '#8B5CF6',
      support: '#F59E0B'
    };
    return colors[type] || '#6B7280';
  }

  toggleFaq(index: number): void {
    this.faqs[index].expanded = !this.faqs[index].expanded;
  }

  protected readonly Pages = Pages;
}
