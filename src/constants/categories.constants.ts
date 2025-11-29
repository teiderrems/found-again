// constants/categories.constants.ts
export interface DefaultCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tags: string[];
  priority: number;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    id: '1',
    name: 'Portefeuille & Documents',
    description: 'Portefeuilles, cartes d\'identité, papiers officiels',
    icon: 'fas fa-wallet',
    color: '#8B4513',
    tags: ['portefeuille', 'carte', 'identité', 'permis', 'papiers', 'document'],
    priority: 1
  },
  {
    id: '2',
    name: 'Clés',
    description: 'Clés de maison, voiture, bureau, coffre',
    icon: 'fas fa-key',
    color: '#FFD700',
    tags: ['clés', 'clefs', 'serrure', 'porte', 'voiture'],
    priority: 2
  },
  {
    id: '3',
    name: 'Téléphone & Électronique',
    description: 'Smartphones, tablettes, écouteurs, chargeurs',
    icon: 'fas fa-mobile-alt',
    color: '#4B0082',
    tags: ['téléphone', 'smartphone', 'mobile', 'écouteurs', 'chargeur', 'tablette'],
    priority: 3
  },
  {
    id: '4',
    name: 'Bijoux & Accessoires',
    description: 'Montres, bagues, colliers, bracelets, boucles d\'oreilles',
    icon: 'fas fa-gem',
    color: '#FF69B4',
    tags: ['bijou', 'montre', 'bague', 'collier', 'bracelet', 'or', 'argent'],
    priority: 4
  },
  {
    id: '5',
    name: 'Vêtements',
    description: 'Vestes, manteaux, chapeaux, écharpes, gants',
    icon: 'fas fa-tshirt',
    color: '#DC143C',
    tags: ['vêtement', 'veste', 'manteau', 'chapeau', 'écharpe', 'gants'],
    priority: 5
  },
  {
    id: '6',
    name: 'Sacs & Bagages',
    description: 'Sacs à main, sacs à dos, valises, porte-documents',
    icon: 'fas fa-briefcase',
    color: '#000080',
    tags: ['sac', 'bagage', 'valise', 'sac à dos', 'porte-documents', 'cartable'],
    priority: 6
  },
  {
    id: '7',
    name: 'Documents importants',
    description: 'Passeports, carnets, dossiers, livres, cahiers',
    icon: 'fas fa-file-alt',
    color: '#696969',
    tags: ['document', 'passeport', 'carnet', 'livre', 'cahier', 'dossier'],
    priority: 7
  },
  {
    id: '8',
    name: 'Équipements sportifs',
    description: 'Raquettes, ballons, matériel de fitness, vélos',
    icon: 'fas fa-basketball-ball',
    color: '#228B22',
    tags: ['sport', 'raquette', 'ballon', 'vélo', 'casque', 'équipement'],
    priority: 8
  },
  {
    id: '9',
    name: 'Lunettes & Optique',
    description: 'Lunettes de vue, lunettes de soleil, lentilles',
    icon: 'fas fa-glasses',
    color: '#2F4F4F',
    tags: ['lunettes', 'vue', 'soleil', 'optique', 'lentilles'],
    priority: 9
  },
  {
    id: '10',
    name: 'Animaux domestiques',
    description: 'Chiens, chats, oiseaux, autres animaux perdus',
    icon: 'fas fa-paw',
    color: '#FF4500',
    tags: ['animal', 'chien', 'chat', 'oiseau', 'perroquet', 'nac'],
    priority: 10
  },
  {
    id: '11',
    name: 'Instruments de musique',
    description: 'Guitares, violons, pianos, instruments à vent',
    icon: 'fas fa-guitar',
    color: '#8A2BE2',
    tags: ['instrument', 'musique', 'guitare', 'violon', 'piano', 'trompette'],
    priority: 11
  },
  {
    id: '12',
    name: 'Jouets & Jeux',
    description: 'Peluches, jeux vidéo, consoles, jouets d\'enfants',
    icon: 'fas fa-gamepad',
    color: '#00BFFF',
    tags: ['jouet', 'jeu', 'peluche', 'console', 'enfant', 'playstation', 'xbox'],
    priority: 12
  },
  {
    id: '13',
    name: 'Outils & Matériel',
    description: 'Outils de bricolage, matériel professionnel',
    icon: 'fas fa-tools',
    color: '#D2691E',
    tags: ['outil', 'bricolage', 'matériel', 'perceuse', 'marteau', 'tournevis'],
    priority: 13
  },
  {
    id: '14',
    name: 'Parapluies',
    description: 'Parapluies, ombrelles, cannes',
    icon: 'fas fa-umbrella',
    color: '#1E90FF',
    tags: ['parapluie', 'ombrelle', 'pluie', 'canne'],
    priority: 14
  },
  {
    id: '15',
    name: 'Médicaments',
    description: 'Traitements médicaux, médicaments importants',
    icon: 'fas fa-pills',
    color: '#FF0000',
    tags: ['médicament', 'traitement', 'santé', 'médical'],
    priority: 15
  },
  {
    id: '16',
    name: 'Livres & Lecture',
    description: 'Livres, magazines, bandes dessinées, manuels',
    icon: 'fas fa-book',
    color: '#8B0000',
    tags: ['livre', 'bd', 'magazine', 'manuel', 'roman'],
    priority: 16
  },
  {
    id: '17',
    name: 'Fournitures scolaires',
    description: 'Trousses, cartables, calculatrices, matériel scolaire',
    icon: 'fas fa-pencil-alt',
    color: '#FF8C00',
    tags: ['scolaire', 'trousse', 'cartable', 'calculatrice', 'crayon'],
    priority: 17
  },
  {
    id: '18',
    name: 'Équipement bébé',
    description: 'Biberons, sucettes, doudous, poussettes',
    icon: 'fas fa-baby',
    color: '#FFB6C1',
    tags: ['bébé', 'biberon', 'sucette', 'doudou', 'poussette'],
    priority: 18
  },
  {
    id: '19',
    name: 'Appareils photo',
    description: 'Appareils photo, objectifs, trépieds',
    icon: 'fas fa-camera',
    color: '#2F4F4F',
    tags: ['appareil photo', 'objectif', 'trépied', 'photographie'],
    priority: 19
  },
  {
    id: '20',
    name: 'Divers',
    description: 'Autres objets non catégorisés',
    icon: 'fas fa-question-circle',
    color: '#808080',
    tags: ['autre', 'divers', 'non catégorisé'],
    priority: 99
  }
];

// Fonctions utilitaires pour les catégories
export const CategoryUtils = {
  // Trouver une catégorie par son ID
  findById(id: string): DefaultCategory | undefined {
    return DEFAULT_CATEGORIES.find(cat => cat.id === id);
  },

  // Trouver une catégorie par son nom
  findByName(name: string): DefaultCategory | undefined {
    return DEFAULT_CATEGORIES.find(cat => 
      cat.name.toLowerCase().includes(name.toLowerCase())
    );
  },

  // Obtenir les catégories triées par priorité
  getSortedByPriority(): DefaultCategory[] {
    return [...DEFAULT_CATEGORIES].sort((a, b) => a.priority - b.priority);
  },

  // Rechercher des catégories par tag
  findByTag(tag: string): DefaultCategory[] {
    const lowerTag = tag.toLowerCase();
    return DEFAULT_CATEGORIES.filter(cat =>
      cat.tags.some(t => t.toLowerCase().includes(lowerTag))
    );
  },

  // Obtenir les catégories les plus populaires (par priorité)
  getPopularCategories(limit: number = 8): DefaultCategory[] {
    return this.getSortedByPriority().slice(0, limit);
  },

  // Générer un identifiant unique pour une nouvelle catégorie
  generateId(): string {
    return (DEFAULT_CATEGORIES.length + 1).toString();
  }
};