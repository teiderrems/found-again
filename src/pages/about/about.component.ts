// components/about.component.ts
import { Component } from '@angular/core';

import { RouterModule } from '@angular/router';

interface TeamMember {
  name: string;
  role: string;
  description: string;
  avatar: string;
  social?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

interface Milestone {
  year: string;
  title: string;
  description: string;
  icon: string;
}

interface Value {
  title: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {
  stats = [
    { value: '125,847+', label: 'Objets Déclarés' },
    { value: '68%', label: 'Taux de Restitution' },
    { value: '50,000+', label: 'Utilisateurs Actifs' },
    { value: '250+', label: 'Partenaires' }
  ];

  milestones: Milestone[] = [
    {
      year: '2020',
      title: 'La Genèse',
      description: 'L\'idée naît après que le fondateur ait perdu son portefeuille lors d\'un voyage. Frustré par l\'absence de solution simple pour les objets perdus, il décide de créer une plateforme dédiée.',
      icon: 'lightbulb'
    },
    {
      year: '2021',
      title: 'Première Version',
      description: 'Lancement de la version bêta avec les fonctionnalités de base : déclaration et recherche d\'objets. Premiers retours positifs de la communauté.',
      icon: 'rocket_launch'
    },
    {
      year: '2022',
      title: 'Croissance',
      description: 'Expansion nationale avec l\'intégration de partenaires locaux. Introduction du système de notifications et de la géolocalisation avancée.',
      icon: 'trending_up'
    },
    {
      year: '2023',
      title: 'Innovation',
      description: 'Lancement de l\'application mobile et intégration de l\'IA pour les correspondances automatiques. La communauté dépasse les 50 000 membres.',
      icon: 'innovation'
    },
    {
      year: '2024',
      title: 'Avenir',
      description: 'Déploiement international et développement de nouvelles fonctionnalités sociales pour renforcer les liens communautaires.',
      icon: 'public'
    }
  ];

  values: Value[] = [
    {
      title: 'Solidarité',
      description: 'Nous croyons en la force de l\'entraide et de la communauté pour résoudre ensemble les petits tracas du quotidien.',
      icon: 'diversity_3',
      color: '#3B82F6'
    },
    {
      title: 'Innovation',
      description: 'Nous utilisons la technologie pour simplifier les processus et créer des expériences utilisateur exceptionnelles.',
      icon: 'auto_awesome',
      color: '#8B5CF6'
    },
    {
      title: 'Confiance',
      description: 'La sécurité des données et la confidentialité de nos utilisateurs sont au cœur de nos préoccupations.',
      icon: 'verified_user',
      color: '#10B981'
    },
    {
      title: 'Accessibilité',
      description: 'Notre service est et restera gratuit, car nous croyons que l\'entraide ne devrait avoir aucune barrière.',
      icon: 'accessibility',
      color: '#F59E0B'
    },
    {
      title: 'Transparence',
      description: 'Nous communiquons ouvertement sur notre fonctionnement, nos succès et nos défis.',
      icon: 'visibility',
      color: '#EF4444'
    },
    {
      title: 'Impact Social',
      description: 'Chaque objet rendu représente une petite victoire pour la communauté et renforce les liens sociaux.',
      icon: 'favorite',
      color: '#EC4899'
    }
  ];

  teamMembers: TeamMember[] = [
    {
      name: 'Thomas Martin',
      role: 'Fondateur & CEO',
      description: 'Passionné par la technologie et l\'innovation sociale. A créé cette plateforme après avoir personnellement vécu la frustration de perdre un objet précieux.',
      avatar: '',
      social: {
        linkedin: '#',
        twitter: '#'
      }
    },
    {
      name: 'Sophie Lambert',
      role: 'Responsable Développement',
      description: 'Développeuse full-stack avec 8 ans d\'expérience. S\'assure que la plateforme reste performante et évolutive.',
      avatar: '',
      social: {
        linkedin: '#',
        github: '#'
      }
    },
    {
      name: 'David Chen',
      role: 'Designer UX/UI',
      description: 'Crée des expériences utilisateur intuitives et engageantes. Passionné par le design centré sur l\'humain.',
      avatar: '',
      social: {
        linkedin: '#',
        twitter: '#'
      }
    },
    {
      name: 'Marie Dubois',
      role: 'Responsable Communauté',
      description: 'Anime et fédère notre communauté d\'utilisateurs. Garantit la qualité des échanges et l\'entraide entre membres.',
      avatar: '',
      social: {
        linkedin: '#'
      }
    }
  ];

  testimonials = [
    {
      name: 'Pierre L.',
      location: 'Paris',
      content: 'J\'ai retrouvé mon téléphone en moins de 24h grâce à cette plateforme. Incroyable efficacité et communauté bienveillante !'
    },
    {
      name: 'Émilie R.',
      location: 'Lyon',
      content: 'En tant qu\'étudiante, perdre mon portefeuille était catastrophique. La solidarité des membres m\'a vraiment touchée.'
    },
    {
      name: 'Mohamed K.',
      location: 'Marseille',
      content: 'J\'ai retrouvé le propriétaire d\'un portefeuille que j\'avais trouvé. La plateforme rend l\'entraide si simple !'
    }
  ];

  getMilestoneColor(index: number): string {
    const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];
    return colors[index % colors.length];
  }

  scrollToStory(): void {
    const storySection = document.querySelector('.about-page section:nth-child(3)');
    if (storySection) {
      storySection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}