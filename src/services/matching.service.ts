import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, updateDoc, doc } from '@angular/fire/firestore';
import { DeclarationData, DeclarationMatch } from '@/types/declaration';

/**
 * Service pour gérer les matchings entre déclarations (LOSS et FOUND)
 * Centralise la logique de calcul et de sauvegarde des correspondances
 */
@Injectable({
  providedIn: 'root'
})
export class MatchingService {
  private readonly firestore = inject(Firestore);

  /**
   * Calcule un score de correspondance entre deux déclarations
   * Score basé sur: catégorie (50%), description (25%), localisation (15%), date (10%)
   */
  calculateMatchScore(decl1: DeclarationData, decl2: DeclarationData): number {
    let score = 0;

    // 1. Catégorie (50% du score)
    const categoryMatch = decl1.category.toLowerCase() === decl2.category.toLowerCase() ? 1 : 0;
    score += categoryMatch * 0.5;

    // 2. Description (25% du score) - Similarité textuelle
    const descriptionSimilarity = this.calculateTextSimilarity(
      decl1.description.toLowerCase(),
      decl2.description.toLowerCase()
    );
    score += descriptionSimilarity * 0.25;

    // 3. Localisation (15% du score)
    const locationScore = this.calculateLocationScore(decl1, decl2);
    score += locationScore * 0.15;

    // 4. Date (10% du score)
    const dateScore = this.calculateDateScore(decl1.date, decl2.date);
    score += dateScore * 0.1;

    return Math.min(score, 1);
  }

  /**
   * Calcule la similarité entre deux textes (Jaro-Winkler distance)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (text1 === text2) return 1;
    if (text1.length === 0 || text2.length === 0) return 0;

    const words1 = text1.split(/\s+/).filter(w => w.length > 3);
    const words2 = text2.split(/\s+/).filter(w => w.length > 3);

    const commonWords = words1.filter(w => 
      words2.some(w2 => this.stringSimilarity(w, w2) > 0.8)
    ).length;

    const maxWords = Math.max(words1.length, words2.length);
    return maxWords > 0 ? commonWords / maxWords : 0;
  }

  /**
   * Calcule la similarité Levenshtein entre deux chaînes
   */
  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calcule la distance d'édition (Levenshtein distance)
   */
  private getEditDistance(s1: string, s2: string): number {
    const costs: number[] = [];
    
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    
    return costs[s2.length];
  }

  /**
   * Calcule le score de correspondance de localisation
   */
  private calculateLocationScore(decl1: DeclarationData, decl2: DeclarationData): number {
    if (decl1.coordinates && decl2.coordinates) {
      const distance = this.calculateDistance(
        decl1.coordinates.lat,
        decl1.coordinates.lng,
        decl2.coordinates.lat,
        decl2.coordinates.lng
      );

      return Math.max(0, 1 - (distance / 50));
    }

    const locationSimilarity = this.calculateTextSimilarity(
      decl1.location.toLowerCase(),
      decl2.location.toLowerCase()
    );

    return locationSimilarity;
  }

  /**
   * Calcule la distance entre deux points GPS (formule Haversine)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convertit les degrés en radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calcule le score de correspondance de date
   */
  private calculateDateScore(date1: string, date2: string): number {
    try {
      const d1 = new Date(date1).getTime();
      const d2 = new Date(date2).getTime();

      if (isNaN(d1) || isNaN(d2)) return 0;

      const diffMs = Math.abs(d1 - d2);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      return Math.max(0, 1 - (diffDays / 30));
    } catch (error) {
      console.error('Erreur lors du calcul de similarité de date:', error);
      return 0;
    }
  }

  /**
   * Génère la raison du matching
   */
  getMatchReason(decl1: DeclarationData, decl2: DeclarationData): string {
    const reasons: string[] = [];

    if (decl1.category === decl2.category) {
      reasons.push(`Même catégorie: ${decl1.category}`);
    }

    if (
      decl1.coordinates &&
      decl2.coordinates &&
      this.calculateDistance(
        decl1.coordinates.lat,
        decl1.coordinates.lng,
        decl2.coordinates.lat,
        decl2.coordinates.lng
      ) < 10
    ) {
      reasons.push('Localisation très proche');
    }

    const similarity = this.calculateTextSimilarity(
      decl1.description.toLowerCase(),
      decl2.description.toLowerCase()
    );
    if (similarity > 0.5) {
      reasons.push('Description similaire');
    }

    const dateScore = this.calculateDateScore(decl1.date, decl2.date);
    if (dateScore > 0.7) {
      reasons.push('Date proche');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Correspondance détectée';
  }

  /**
   * Sauvegarde un matching dans Firestore
   */
  async saveMatch(
    userId: string,
    match: DeclarationMatch
  ): Promise<string | null> {
    try {
      const matchesRef = collection(this.firestore, 'matches');
      
      // Vérifier si le matching existe déjà
      const existingQuery = query(
        matchesRef,
        where('declarationId1', '==', match.declaration.id),
        where('declarationId2', '==', match.matchingWith.id)
      );
      
      const existingDocs = await getDocs(existingQuery);
      
      if (existingDocs.empty) {
        const matchData = {
          userId,
          declarationId1: match.declaration.id,
          declarationId2: match.matchingWith.id,
          confidence: match.confidence,
          reason: match.reason,
          type: match.declaration.type === 'loss' ? 'loss_to_found' : 'found_to_loss',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const docRef = await addDoc(matchesRef, matchData);
        console.log(`Matching sauvegardé: ${match.declaration.id} <-> ${match.matchingWith.id} (${(match.confidence * 100).toFixed(0)}%)`);
        return docRef.id;
      } else {
        console.log(`Matching déjà existant: ${match.declaration.id} <-> ${match.matchingWith.id}`);
        return existingDocs.docs[0].id;
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du matching:', error);
      return null;
    }
  }

  /**
   * Met à jour le statut d'un matching
   */
  async updateMatchStatus(
    matchId: string,
    status: 'pending' | 'confirmed' | 'rejected' | 'closed'
  ): Promise<void> {
    try {
      const matchRef = doc(this.firestore, 'matches', matchId);
      await updateDoc(matchRef, {
        status,
        updatedAt: new Date()
      });
      console.log(`Statut du matching ${matchId} mis à jour: ${status}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  }
}
