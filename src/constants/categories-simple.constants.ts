// constants/categories-simple-material.constants.ts
export interface SimpleMaterialCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const SIMPLE_MATERIAL_CATEGORIES: SimpleMaterialCategory[] = [
  {
    id: '1',
    name: 'Portefeuille/Carte d\'identité',
    icon: 'account_balance_wallet',
    color: '#8B4513'
  },
  {
    id: '2',
    name: 'Clés',
    icon: 'key',
    color: '#FFD700'
  },
  {
    id: '3',
    name: 'Téléphone',
    icon: 'smartphone',
    color: '#4B0082'
  },
  {
    id: '4',
    name: 'Bijoux',
    icon: 'watch',
    color: '#FF69B4'
  },
  {
    id: '5',
    name: 'Vêtements',
    icon: 'checkroom',
    color: '#DC143C'
  },
  {
    id: '6',
    name: 'Sac/Porte-documents',
    icon: 'business_center',
    color: '#000080'
  },
  {
    id: '7',
    name: 'Documents',
    icon: 'description',
    color: '#696969'
  },
  {
    id: '8',
    name: 'Équipements électroniques',
    icon: 'computer',
    color: '#008080'
  },
  {
    id: '9',
    name: 'Animaux',
    icon: 'pets',
    color: '#FF4500'
  },
  {
    id: '10',
    name: 'Autre',
    icon: 'category',
    color: '#808080'
  }
];