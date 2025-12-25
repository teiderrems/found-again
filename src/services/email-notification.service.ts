import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { 
  Firestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  getDoc,
  Timestamp,
  doc,
  updateDoc,
  collectionData,
  orderBy,
  limit
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject, from, map, switchMap, catchError, of } from 'rxjs';
import { AuthService } from './auth.service';
import { UserProfileService } from './user-profile.service';

/**
 * Interface pour les logs d'emails envoyés
 */
export interface EmailLog {
  id?: string;
  userId: string;
  recipient: string;
  subject: string;
  type: 'notification' | 'verification' | 'match' | 'update' | 'alert';
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  sentAt?: Date | Timestamp;
  failureReason?: string;
  templateData?: any;
}

/**
 * Interface pour les paramètres d'email
 */
export interface EmailParams {
  userId: string;
  recipientEmail: string;
  subject: string;
  type: 'notification' | 'verification' | 'match' | 'update' | 'alert';
  templateData?: {
    title?: string;
    message?: string;
    actionUrl?: string;
    declarationId?: string;
    userName?: string;
    objectName?: string;
    [key: string]: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EmailNotificationService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  private http = inject(HttpClient);

  private emailLogsSubject = new BehaviorSubject<EmailLog[]>([]);
  public emailLogs$ = this.emailLogsSubject.asObservable();

  constructor() {
    this.initializeEmailLogs();
  }

  /**
   * Charge les logs d'emails de l'utilisateur
   */
  private initializeEmailLogs(): void {
    this.authService.currentUser$.pipe(
      switchMap(user => {
        if (!user) {
          this.emailLogsSubject.next([]);
          return of([]);
        }
        return this.getEmailLogs(user.uid);
      })
    ).subscribe({
      next: (logs) => this.emailLogsSubject.next(logs),
      error: (error) => console.error('Erreur lors du chargement des logs d\'emails:', error)
    });
  }

  /**
   * Récupère les logs d'emails d'un utilisateur
   */
  getEmailLogs(userId: string): Observable<EmailLog[]> {
    const emailLogsRef = collection(this.firestore, 'emailLogs');
    const q = query(
      emailLogsRef,
      where('userId', '==', userId),
      orderBy('sentAt', 'desc'),
      limit(50)
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as EmailLog));
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des logs d\'emails:', error);
        return of([]);
      })
    );
  }

  /**
   * Envoie un email de notification
   * Requiert une Cloud Function backend
   */
  async sendNotificationEmail(params: EmailParams): Promise<boolean> {
    try {
      // Vérifier les préférences d'email de l'utilisateur
      const canSendEmail = await this.canSendEmailToUser(params.userId);
      if (!canSendEmail) {
        console.warn('L\'utilisateur n\'a pas autorisé les notifications par email');
        return false;
      }

      // Créer un log d'email en attente
      const emailLog: EmailLog = {
        userId: params.userId,
        recipient: params.recipientEmail,
        subject: params.subject,
        type: params.type,
        status: 'pending',
        sentAt: Timestamp.now(),
        templateData: params.templateData
      };

      // Enregistrer le log
      const logRef = collection(this.firestore, 'emailLogs');
      const docRef = await addDoc(logRef, emailLog);

      // Appeler la Cloud Function pour envoyer l'email
      const success = await this.callSendEmailFunction(params, docRef.id);

      if (success) {
        // Mettre à jour le statut du log
        await updateDoc(docRef, { status: 'sent' });
        console.log('Email envoyé avec succès:', params.subject);
        return true;
      } else {
        // Mettre à jour le statut d'erreur
        await updateDoc(docRef, { 
          status: 'failed',
          failureReason: 'Erreur lors de l\'appel à la Cloud Function'
        });
        console.error('Erreur lors de l\'envoi de l\'email');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return false;
    }
  }

  /**
   * Envoie un email de vérification (double-opt-in)
   */
  async sendVerificationEmail(userId: string, email: string): Promise<boolean> {
    return this.sendNotificationEmail({
      userId,
      recipientEmail: email,
      subject: 'Vérification de votre adresse email - Found Again',
      type: 'verification',
      templateData: {
        verificationUrl: `${window.location.origin}/verify-email?uid=${userId}&email=${encodeURIComponent(email)}`
      }
    });
  }

  /**
   * Envoie une notification de correspondance trouvée
   */
  async sendMatchNotificationEmail(
    userId: string, 
    email: string, 
    matchData: {
      objectName: string;
      matchedObjectName: string;
      confidence: number;
      declarationId: string;
    }
  ): Promise<boolean> {
    return this.sendNotificationEmail({
      userId,
      recipientEmail: email,
      subject: `Correspondance trouvée: ${matchData.objectName} - Found Again`,
      type: 'match',
      templateData: {
        title: 'Une correspondance a été trouvée!',
        message: `Nous avons trouvé une correspondance possible avec confiance de ${Math.round(matchData.confidence * 100)}%`,
        objectName: matchData.objectName,
        matchedObjectName: matchData.matchedObjectName,
        confidence: matchData.confidence,
        actionUrl: `/declarations/${matchData.declarationId}`,
        declarationId: matchData.declarationId
      }
    });
  }

  /**
   * Envoie une notification de mise à jour de déclaration
   */
  async sendDeclarationUpdateEmail(
    userId: string,
    email: string,
    updateData: {
      declarationId: string;
      objectName: string;
      updateType: 'status_changed' | 'message_received' | 'match_found';
      updateMessage: string;
    }
  ): Promise<boolean> {
    const subjectMap = {
      status_changed: `Mise à jour de votre déclaration: ${updateData.objectName}`,
      message_received: `Nouveau message sur: ${updateData.objectName}`,
      match_found: `Correspondance trouvée pour: ${updateData.objectName}`
    };

    return this.sendNotificationEmail({
      userId,
      recipientEmail: email,
      subject: subjectMap[updateData.updateType],
      type: 'update',
      templateData: {
        title: subjectMap[updateData.updateType],
        message: updateData.updateMessage,
        objectName: updateData.objectName,
        actionUrl: `/declarations/${updateData.declarationId}`,
        declarationId: updateData.declarationId,
        updateType: updateData.updateType
      }
    });
  }

  /**
   * Envoie une alerte de sécurité
   */
  async sendSecurityAlertEmail(
    userId: string,
    email: string,
    alertData: {
      title: string;
      message: string;
      actionUrl?: string;
    }
  ): Promise<boolean> {
    return this.sendNotificationEmail({
      userId,
      recipientEmail: email,
      subject: `Alerte de sécurité: ${alertData.title}`,
      type: 'alert',
      templateData: {
        title: alertData.title,
        message: alertData.message,
        actionUrl: alertData.actionUrl,
        isSecurityAlert: true
      }
    });
  }

  /**
   * Vérifie si l'utilisateur a autorisé les notifications par email
   */
  private async canSendEmailToUser(userId: string): Promise<boolean> {
    try {
      const preferences = await this.userProfileService.getUserPreferences(userId).toPromise();
      return preferences?.emailNotifications ?? false;
    } catch (error) {
      console.warn('Erreur lors de la vérification des préférences email:', error);
      return false;
    }
  }

  /**
   * Appelle la Cloud Function pour envoyer l'email
   * Nécessite une Cloud Function déployée
   */
  private async callSendEmailFunction(params: EmailParams, logId: string): Promise<boolean> {
    try {
      // Pour le moment, on simule l'envoi en attendant la Cloud Function
      // En production, voici comment appeler la Cloud Function:
      /*
      const token = await new Promise<string>((resolve, reject) => {
        this.authService.currentUser$.pipe(
          switchMap(user => {
            if (!user) {
              reject('Utilisateur non authentifié');
              return of('');
            }
            return from(user.getIdToken());
          })
        ).subscribe({
          next: (token) => resolve(token),
          error: (error) => reject(error)
        });
      });

      const response = await this.http.post<{ success: boolean }>(
        'https://region-projectid.cloudfunctions.net/sendEmail',
        params,
        { headers: { Authorization: `Bearer ${token}` } }
      ).toPromise();

      return response?.success || false;
      */
      
      // Simulation: Log l'email sans l'envoyer réellement
      console.log('Email simulé (Cloud Function non configurée):', params);
      return true;
    } catch (error) {
      console.error('Erreur callSendEmailFunction:', error);
      return false;
    }
  }

  /**
   * Obtient les statistiques d'emails envoyés
   */
  getEmailStatistics(userId: string): Observable<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }> {
    return this.getEmailLogs(userId).pipe(
      map(logs => ({
        total: logs.length,
        sent: logs.filter(l => l.status === 'sent').length,
        failed: logs.filter(l => l.status === 'failed').length,
        pending: logs.filter(l => l.status === 'pending').length
      }))
    );
  }

  /**
   * Envoie un email de test
   */
  async sendTestEmail(userId: string, email: string): Promise<boolean> {
    return this.sendNotificationEmail({
      userId,
      recipientEmail: email,
      subject: 'Email de test - Found Again',
      type: 'notification',
      templateData: {
        title: 'Email de test',
        message: 'Cet email est un test pour vérifier que votre adresse est correcte',
        isTestEmail: true
      }
    });
  }

  /**
   * Réessaye d'envoyer un email qui a échoué
   */
  async retryFailedEmail(logId: string): Promise<boolean> {
    try {
      const logRef = doc(this.firestore, 'emailLogs', logId);
      
      // Récupérer le log d'email
      const logSnapshot = await getDoc(logRef);
      const log = logSnapshot.data() as EmailLog;

      if (!log) {
        console.error('Log d\'email non trouvé:', logId);
        return false;
      }

      // Mettre à jour le statut en pending
      await updateDoc(logRef, { status: 'pending' });

      // Créer les paramètres et réessayer
      const params: EmailParams = {
        userId: log.userId,
        recipientEmail: log.recipient,
        subject: log.subject,
        type: log.type,
        templateData: log.templateData
      };

      const success = await this.callSendEmailFunction(params, logId);

      if (success) {
        await updateDoc(logRef, { status: 'sent' });
        return true;
      } else {
        await updateDoc(logRef, { 
          status: 'failed',
          failureReason: 'Erreur lors de la nouvelle tentative'
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la nouvelle tentative:', error);
      return false;
    }
  }

  /**
   * Obtient les emails non lus/non traités
   */
  getPendingEmails(userId: string): Observable<EmailLog[]> {
    const emailLogsRef = collection(this.firestore, 'emailLogs');
    const q = query(
      emailLogsRef,
      where('userId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('sentAt', 'asc')
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as EmailLog));
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des emails en attente:', error);
        return of([]);
      })
    );
  }
}
