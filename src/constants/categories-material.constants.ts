// constants/categories-material.constants.ts
export interface MaterialCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tags: string[];
  priority: number;
}

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  {
    id: '1',
    name: 'Portefeuille & Documents',
    description: 'Portefeuilles, cartes d\'identité, papiers officiels',
    icon: 'account_balance_wallet',
    color: '#8B4513',
    tags: ['portefeuille', 'carte', 'identité', 'permis', 'papiers', 'document'],
    priority: 1
  },
  {
    id: '2',
    name: 'Clés',
    description: 'Clés de maison, voiture, bureau, coffre',
    icon: 'key',
    color: '#FFD700',
    tags: ['clés', 'clefs', 'serrure', 'porte', 'voiture'],
    priority: 2
  },
  {
    id: '3',
    name: 'Téléphone & Électronique',
    description: 'Smartphones, tablettes, écouteurs, chargeurs',
    icon: 'smartphone',
    color: '#4B0082',
    tags: ['téléphone', 'smartphone', 'mobile', 'écouteurs', 'chargeur', 'tablette'],
    priority: 3
  },
  {
    id: '4',
    name: 'Bijoux & Accessoires',
    description: 'Montres, bagues, colliers, bracelets, boucles d\'oreilles',
    icon: 'watch',
    color: '#FF69B4',
    tags: ['bijou', 'montre', 'bague', 'collier', 'bracelet', 'or', 'argent'],
    priority: 4
  },
  {
    id: '5',
    name: 'Vêtements',
    description: 'Vestes, manteaux, chapeaux, écharpes, gants',
    icon: 'checkroom',
    color: '#DC143C',
    tags: ['vêtement', 'veste', 'manteau', 'chapeau', 'écharpe', 'gants'],
    priority: 5
  },
  {
    id: '6',
    name: 'Sacs & Bagages',
    description: 'Sacs à main, sacs à dos, valises, porte-documents',
    icon: 'business_center',
    color: '#000080',
    tags: ['sac', 'bagage', 'valise', 'sac à dos', 'porte-documents', 'cartable'],
    priority: 6
  },
  {
    id: '7',
    name: 'Documents importants',
    description: 'Passeports, carnets, dossiers, livres, cahiers',
    icon: 'description',
    color: '#696969',
    tags: ['document', 'passeport', 'carnet', 'livre', 'cahier', 'dossier'],
    priority: 7
  },
  {
    id: '8',
    name: 'Équipements sportifs',
    description: 'Raquettes, ballons, matériel de fitness, vélos',
    icon: 'sports',
    color: '#228B22',
    tags: ['sport', 'raquette', 'ballon', 'vélo', 'casque', 'équipement'],
    priority: 8
  },
  {
    id: '9',
    name: 'Lunettes & Optique',
    description: 'Lunettes de vue, lunettes de soleil, lentilles',
    icon: 'visibility',
    color: '#2F4F4F',
    tags: ['lunettes', 'vue', 'soleil', 'optique', 'lentilles'],
    priority: 9
  },
  {
    id: '10',
    name: 'Animaux domestiques',
    description: 'Chiens, chats, oiseaux, autres animaux perdus',
    icon: 'pets',
    color: '#FF4500',
    tags: ['animal', 'chien', 'chat', 'oiseau', 'perroquet', 'nac'],
    priority: 10
  },
  {
    id: '11',
    name: 'Instruments de musique',
    description: 'Guitares, violons, pianos, instruments à vent',
    icon: 'music_note',
    color: '#8A2BE2',
    tags: ['instrument', 'musique', 'guitare', 'violon', 'piano', 'trompette'],
    priority: 11
  },
  {
    id: '12',
    name: 'Jouets & Jeux',
    description: 'Peluches, jeux vidéo, consoles, jouets d\'enfants',
    icon: 'sports_esports',
    color: '#00BFFF',
    tags: ['jouet', 'jeu', 'peluche', 'console', 'enfant', 'playstation', 'xbox'],
    priority: 12
  },
  {
    id: '13',
    name: 'Outils & Matériel',
    description: 'Outils de bricolage, matériel professionnel',
    icon: 'build',
    color: '#D2691E',
    tags: ['outil', 'bricolage', 'matériel', 'perceuse', 'marteau', 'tournevis'],
    priority: 13
  },
  {
    id: '14',
    name: 'Parapluies',
    description: 'Parapluies, ombrelles, cannes',
    icon: 'beach_access',
    color: '#1E90FF',
    tags: ['parapluie', 'ombrelle', 'pluie', 'canne'],
    priority: 14
  },
  {
    id: '15',
    name: 'Médicaments',
    description: 'Traitements médicaux, médicaments importants',
    icon: 'medication',
    color: '#FF0000',
    tags: ['médicament', 'traitement', 'santé', 'médical'],
    priority: 15
  },
  {
    id: '16',
    name: 'Livres & Lecture',
    description: 'Livres, magazines, bandes dessinées, manuels',
    icon: 'menu_book',
    color: '#8B0000',
    tags: ['livre', 'bd', 'magazine', 'manuel', 'roman'],
    priority: 16
  },
  {
    id: '17',
    name: 'Fournitures scolaires',
    description: 'Trousses, cartables, calculatrices, matériel scolaire',
    icon: 'school',
    color: '#FF8C00',
    tags: ['scolaire', 'trousse', 'cartable', 'calculatrice', 'crayon'],
    priority: 17
  },
  {
    id: '18',
    name: 'Équipement bébé',
    description: 'Biberons, sucettes, doudous, poussettes',
    icon: 'child_care',
    color: '#FFB6C1',
    tags: ['bébé', 'biberon', 'sucette', 'doudou', 'poussette'],
    priority: 18
  },
  {
    id: '19',
    name: 'Appareils photo',
    description: 'Appareils photo, objectifs, trépieds',
    icon: 'photo_camera',
    color: '#2F4F4F',
    tags: ['appareil photo', 'objectif', 'trépied', 'photographie'],
    priority: 19
  },
  {
    id: '20',
    name: 'Divers',
    description: 'Autres objets non catégorisés',
    icon: 'category',
    color: '#808080',
    tags: ['autre', 'divers', 'non catégorisé'],
    priority: 99
  }
];