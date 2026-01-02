/**
 * Cloud Functions - Index
 * Exporte toutes les Cloud Functions
 */

import * as functions from 'firebase-functions';
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

// Initialiser Firebase Admin
admin.initializeApp();

// ============= Configuration Email =============
const getEmailTransporter = () => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    console.warn('Variables Gmail non configurées. Email simulé uniquement.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword
    }
  });
};

// ============= Types =============
interface EmailParams {
  userId: string;
  recipientEmail: string;
  subject: string;
  type: 'notification' | 'verification' | 'match' | 'update' | 'alert';
  templateData?: {
    title?: string;
    message?: string;
    actionUrl?: string;
    [key: string]: any;
  };
}

// ============= User Management Functions =============

/**
 * Active ou désactive un utilisateur (Auth + Firestore)
 * Accessible uniquement aux administrateurs
 */
export const toggleUserStatus = onCall({ cors: true }, async (request) => {
  // Vérifier l'authentification
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'L\'utilisateur doit être connecté.');
  }

  const callerUid = request.auth.uid;
  const { targetUid, isActive } = request.data;

  console.log('toggleUserStatus called with:', { targetUid, isActive, callerUid });

  if (!targetUid || isActive === undefined) {
    throw new HttpsError('invalid-argument', 'Les paramètres targetUid et isActive sont requis.');
  }

  try {
    // Vérifier si l'appelant est admin
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    const callerData = callerDoc.data();

    if (!callerData || callerData.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Seuls les administrateurs peuvent effectuer cette action.');
    }

    // 1. Mettre à jour le statut dans Firebase Auth (disabled = !isActive)
    await admin.auth().updateUser(targetUid, {
      disabled: !isActive
    });

    // 2. Mettre à jour le statut dans Firestore pour l'affichage
    await admin.firestore().collection('users').doc(targetUid).update({
      isActive: isActive
    });

    console.log(`Utilisateur ${targetUid} ${isActive ? 'activé' : 'désactivé'} par ${callerUid}`);
    return { success: true };

  } catch (error) {
    console.error('Erreur lors du changement de statut utilisateur:', error);
    throw new HttpsError('internal', 'Une erreur est survenue lors du changement de statut.');
  }
});

// ============= Cloud Functions =============

/**
 * HTTP Cloud Function pour envoyer un email
 * Appelée par le service Angular
 */
export const sendEmail = functions.https.onRequest(async (request, response) => {
  // Éviter les erreurs CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  try {
    // Vérifier que c'est une requête POST
    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const params = request.body as EmailParams;

    // Validation basique
    if (!params.userId || !params.recipientEmail || !params.subject) {
      response.status(400).json({ error: 'Missing required fields' });
      return;
    }

    console.log(`Envoi d'email à ${params.recipientEmail}...`);

    // Récupérer le transporter
    const transporter = getEmailTransporter();

    if (!transporter) {
      // Mode simulation
      console.log('Email simulé (pas de SMTP configuré):', {
        to: params.recipientEmail,
        subject: params.subject,
        type: params.type
      });

      // Logger dans Firestore
      await admin.firestore().collection('emailLogs').add({
        userId: params.userId,
        recipient: params.recipientEmail,
        subject: params.subject,
        type: params.type,
        status: 'sent',
        sentAt: admin.firestore.Timestamp.now(),
        templateData: params.templateData || {}
      });

      response.json({ success: true, message: 'Email simulé' });
      return;
    }

    // Générer le HTML de l'email
    const htmlContent = generateEmailHTML(params);

    // Envoyer l'email
    const result = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: params.recipientEmail,
      subject: params.subject,
      html: htmlContent,
      text: params.templateData?.message || 'Voir la version HTML'
    });

    console.log(`Email envoyé avec succès: ${result.messageId}`);

    // Logger dans Firestore
    await admin.firestore().collection('emailLogs').add({
      userId: params.userId,
      recipient: params.recipientEmail,
      subject: params.subject,
      type: params.type,
      status: 'sent',
      sentAt: admin.firestore.Timestamp.now(),
      templateData: params.templateData || {}
    });

    response.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi:', error.message);

    // Logger l'erreur dans Firestore
    try {
      const params = request.body as EmailParams;
      await admin.firestore().collection('emailLogs').add({
        userId: params.userId || 'unknown',
        recipient: params.recipientEmail || 'unknown',
        subject: params.subject || 'unknown',
        type: params.type || 'notification',
        status: 'failed',
        failureReason: error.message,
        sentAt: admin.firestore.Timestamp.now(),
        templateData: params.templateData || {}
      });
    } catch (logError) {
      console.error('Erreur logging:', logError);
    }

    response.status(500).json({ error: error.message });
  }
});

/**
 * Callable Cloud Function pour envoyer un email de réinitialisation de mot de passe
 */
export const sendPasswordReset = onCall({ cors: true }, async (request) => {
  const email = request.data.email;
  
  if (!email) {
    throw new HttpsError('invalid-argument', 'L\'email est requis.');
  }

  try {
    // Générer le lien de réinitialisation
    const firebaseLink = await admin.auth().generatePasswordResetLink(email);
    
    // Extraire le oobCode du lien Firebase
    const urlObj = new URL(firebaseLink);
    const oobCode = urlObj.searchParams.get('oobCode');
    
    // Construire le lien vers notre application Angular
    // Note: Assurez-vous que l'URL de base correspond à votre déploiement
    const appUrl = 'https://found-again-4a0e0.web.app'; // ou localhost en dev
    const link = `${appUrl}/reset-password?oobCode=${oobCode}`;
    
    const transporter = getEmailTransporter();
    
    if (!transporter) {
      console.log('Email simulé (pas de SMTP):', { to: email, link });
      return { success: true, message: 'Email simulé', link };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
          .card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 28px; font-weight: bold; color: #16a34a; }
          .title { font-size: 20px; font-weight: 600; color: #166534; margin: 16px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
          .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <div class="logo">Found Again</div>
            </div>
            <h1 class="title">Réinitialisation de mot de passe</h1>
            
            <p>Bonjour,</p>
            <p>Suivez ce lien pour réinitialiser votre mot de passe Found Again pour votre compte ${email}.</p>
            
            <div style="text-align: center;">
              <a href="${link}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            
            <p style="margin-top: 24px; font-size: 14px;">Si vous n'avez pas demandé à réinitialiser votre mot de passe, vous pouvez ignorer cet email.</p>
            
            <p>Merci,</p>
            <p>L'équipe Found Again</p>
          </div>
          <div class="footer">
            <p>© 2025 Found Again. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Réinitialisation de votre mot de passe - Found Again',
      html: htmlContent
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erreur sendPasswordReset:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Trigger Firestore - Envoyer un email quand une nouvelle déclaration est créée
 */
export const onDeclarationCreated = functions.firestore
  .document('declarations/{declarationId}')
  .onCreate(async (snap) => {
    try {

      const declaration = snap.data();
      if (!declaration || !declaration.userId || !declaration.category || !declaration.type || declaration.type === 'loss') {
        return;
      }
      const userId = declaration.userId;

      // Récupérer l'utilisateur créateur
      const creatorDoc = await admin.firestore().collection('users').doc(userId).get();
      const creatorData = creatorDoc.data();

      const userIds = await admin.firestore().collection('declarations').select('userId')
      .where('active', '==', true)
      .where('category', '==', declaration.category)
      .where('type', '!=', declaration.type)
      .where('userId', '!=', userId).get();

      // Récupérer tous les utilisateurs
      const usersSnapshot = await admin.firestore().collection('users').where('id','in', userIds.docs.map(d=>d.data().userId))
      .where('role', '!=', 'admin').get();
      const users = usersSnapshot.docs;

      const transporter = getEmailTransporter();
      const declarationType = declaration.type === 'found' ? 'Objet trouvé' : 'Objet perdu';
      const emoji = '';

      // Envoyer à chaque utilisateur (sauf admins et créateur)
      for (const userDoc of users) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Vérifier les préférences
        if (userData.emailNotifications === false) {
          console.log(`Notifications email désactivées pour ${userId}`);
          continue;
        }

        if (!userData.email) {
          console.warn(`Pas d'email pour l'utilisateur ${userId}`);
          continue;
        }

        // Envoyer email
        if (transporter) {
          const htmlContent = `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
                .card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 24px; }
                .logo { font-size: 28px; font-weight: bold; color: #16a34a; }
                .declaration-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; margin: 16px 0; font-weight: bold; }
                .title { font-size: 20px; font-weight: 600; color: #166534; margin: 16px 0; }
                .object-info { background: #f0fdf4; padding: 16px; border-radius: 6px; margin: 16px 0; }
                .button { display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
                .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #999; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="header">
                    <div class="logo">Found Again</div>
                  </div>
                  <div class="declaration-badge">${emoji} NOUVELLE DÉCLARATION</div>
                  <h1 class="title">Nouvelle ${declaration.type === 'found' ? 'trouvaille' : 'perte'} signalée!</h1>
                  
                  <div class="object-info">
                    <strong>Type:</strong><br/>
                    ${declarationType}<br/><br/>
                    <strong>Objet:</strong><br/>
                    ${declaration.objectName || 'Objet'}<br/><br/>
                    <strong>Description:</strong><br/>
                    ${declaration.description || 'Aucune description'}<br/><br/>
                    <strong>Localisation:</strong><br/>
                    ${declaration.location || 'Non spécifiée'}
                  </div>

                  <p>Vérifiez si cela correspond à votre recherche ou à ce que vous avez trouvé!</p>
                  <a href="https://found-again.web.app/declarations/${snap.id}" class="button">Voir la déclaration</a>
                </div>
                <div class="footer">
                  <p>© 2025 Found Again. Tous droits réservés.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          try {
            await transporter.sendMail({
              from: process.env.GMAIL_USER,
              to: userData.email,
              subject: `${emoji} Nouvelle déclaration: ${declaration.objectName}`,
              html: htmlContent
            });

            console.log(`Email de déclaration envoyé à ${userData.email}`);
          } catch (emailError) {
            console.error(`Erreur envoi email à ${userData.email}:`, emailError);
          }
        }
      }

      // Logger dans Firestore
      await admin.firestore().collection('emailLogs').add({
        userId: userId,
        recipient: 'all_users',
        subject: `Déclaration créée: ${declaration.objectName}`,
        type: 'notification',
        status: 'sent',
        sentAt: admin.firestore.Timestamp.now(),
        declarationId: snap.id,
        declarationType: declaration.type,
        sentToAllUsers: true
      });

    } catch (error) {
      console.error('Erreur envoi email déclaration:', error);
    }
  });

/**
 * Trigger Firestore - Envoyer notification FCM à tous les utilisateurs quand une déclaration est créée
 */
export const onDeclarationCreatedFCM = functions.firestore
  .document('declarations/{declarationId}')
  .onCreate(async (snap) => {
    try {
      const declaration = snap.data();
      const creatorId = declaration.userId;

      // Récupérer tous les utilisateurs
      const usersSnapshot = await admin.firestore().collection('users').get();
      const users = usersSnapshot.docs;

      const emoji = '';

      // Envoyer FCM à chaque utilisateur (sauf admins et créateur)
      for (const userDoc of users) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Skipped les admins et le créateur
        if (userData.role === 'admin' || userId === creatorId) {
          console.log(`Skipped ${userData.role === 'admin' ? 'admin' : 'creator'} ${userId}`);
          continue;
        }

        // Vérifier les préférences
        if (userData.emailNotifications === false) {
          console.log(`Notifications désactivées pour ${userId}`);
          continue;
        }

        // Vérifier si l'utilisateur a un token FCM
        if (!userData.fcmToken) {
          console.log(`Pas de token FCM pour ${userId}`);
          continue;
        }

        // Envoyer notification FCM
        try {
          await sendFCMNotification(userId, {
            title: `${emoji} Nouvelle déclaration: ${declaration.objectName}`,
            body: `${declaration.type === 'found' ? 'Trouvaille' : 'Perte'} signalée - ${declaration.location || 'Localisation non spécifiée'}`,
            data: {
              type: 'declaration_broadcast',
              declarationId: snap.id,
              link: `/declarations/${snap.id}`
            }
          });
        } catch (error) {
          console.error(`Erreur FCM pour ${userId}:`, error);
        }
      }

    } catch (error) {
      console.error('Erreur FCM déclaration broadcast:', error);
    }
  });

/**
 * Utilitaire - Envoyer une notification FCM
 */
async function sendFCMNotification(userId: string, payload: {
  title: string;
  body: string;
  data?: { [key: string]: string };
}) {
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || !userData.fcmToken) {
      console.log(`Pas de token FCM pour ${userId}`);
      return;
    }

    const message = {
      token: userData.fcmToken,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: payload.data || {},
      webpush: {
        fcmOptions: {
          link: payload.data?.link || 'https://found-again.web.app'
        }
      }
    };

    const response = await admin.messaging().send(message as any);
    console.log(`FCM notification envoyée (${response})`);

    // Logger la notification
    await admin.firestore().collection('notificationLogs').add({
      userId: userId,
      title: payload.title,
      body: payload.body,
      type: payload.data?.type || 'notification',
      status: 'sent',
      sentAt: admin.firestore.Timestamp.now(),
      fcmResponse: response
    });
  } catch (error: any) {
    console.error('Erreur FCM notification:', error.message);
    
    // Si le token est invalide, le supprimer
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.log(`Suppression du token invalide pour ${userId}`);
      await admin.firestore().collection('users').doc(userId).update({
        fcmToken: admin.firestore.FieldValue.delete()
      });
    }
  }
}

/**
 * Trigger Firestore - Envoyer notification FCM quand une notification est créée
 */
export const onNotificationCreatedFCM = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap) => {
    try {
      const notification = snap.data();
      const userId = notification.userId;

      // Vérifier les préférences
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData || userData.emailNotifications === false) {
        console.log(`Notifications désactivées pour ${userId}`);
        return;
      }

      await sendFCMNotification(userId, {
        title: notification.title || 'Nouvelle notification',
        body: notification.message || 'Vous avez une nouvelle notification',
        data: {
          type: 'notification',
          notificationId: snap.id
        }
      });
    } catch (error) {
      console.error('Erreur FCM notification:', error);
    }
  });

/**
 * Trigger Firestore - Envoyer notification FCM quand une correspondance est créée
 */
export const onMatchCreatedFCM = functions.firestore
  .document('matches/{matchId}')
  .onCreate(async (snap) => {
    try {
      const match = snap.data();
      const userId = match.userId;

      // Vérifier les préférences
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData || userData.emailNotifications === false) {
        console.log(`Notifications désactivées pour ${userId}`);
        return;
      }

      // Récupérer les déclarations pour les infos
      const dec1 = await admin.firestore().collection('declarations').doc(match.declarationId1).get();
      const dec2 = await admin.firestore().collection('declarations').doc(match.declarationId2).get();

      const objectName = dec1.exists ? dec1.data()?.objectName : 'Objet';
      const matchedObjectName = dec2.exists ? dec2.data()?.objectName : 'Objet';

      await sendFCMNotification(userId, {
        title: 'Correspondance trouvée!',
        body: `"${objectName}" correspond à "${matchedObjectName}" (${(match.confidence * 100).toFixed(0)}%)`,
        data: {
          type: 'match_found',
          matchId: snap.id,
          link: `/dashboard/matches/${snap.id}`
        }
      });
    } catch (error) {
      console.error('Erreur FCM match:', error);
    }
  });

/**
 * Trigger Firestore - Envoyer notification FCM quand une déclaration change de statut
 */
export const onDeclarationStatusChangedFCM = functions.firestore
  .document('declarations/{declarationId}')
  .onUpdate(async (change) => {
    try {
      const before = change.before.data();
      const after = change.after.data();

      // Vérifier si le statut a changé
      if (before.status === after.status) {
        return;
      }

      const userId = after.userId;

      // Vérifier les préférences
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData || userData.emailNotifications === false) {
        console.log(`Notifications désactivées pour ${userId}`);
        return;
      }

      const statusEmojis: { [key: string]: string } = {
        'active': '',
        'resolved': '',
        'closed': '',
        'archived': ''
      };

      const emoji = statusEmojis[after.status] || '';

      await sendFCMNotification(userId, {
        title: `${emoji} Déclaration ${after.status}`,
        body: `"${after.objectName}" - Statut: ${after.status}`,
        data: {
          type: 'declaration_updated',
          declarationId: change.after.id,
          status: after.status,
          link: `/declarations/${change.after.id}`
        }
      });
    } catch (error) {
      console.error('Erreur FCM déclaration:', error);
    }
  });

/**
 * Trigger Firestore - Envoyer notification FCM quand une vérification est approuvée
 */
export const onVerificationCompletedFCM = functions.firestore
  .document('verifications/{verificationId}')
  .onUpdate(async (change) => {
    try {
      const before = change.before.data();
      const after = change.after.data();

      // Vérifier si le statut est passé à 'approved'
      if (before.status !== 'approved' && after.status === 'approved') {
        const userId = after.userId;

        // Vérifier les préférences
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (!userData || userData.emailNotifications === false) {
          console.log(`Notifications désactivées pour ${userId}`);
          return;
        }

        await sendFCMNotification(userId, {
          title: 'Identité vérifiée!',
          body: 'Félicitations! Votre identité a été vérifiée avec succès.',
          data: {
            type: 'verification_approved',
            verificationId: change.after.id,
            link: '/dashboard'
          }
        });
      }
    } catch (error) {
      console.error('Erreur FCM vérification:', error);
    }
  });

/**
 * Trigger Firestore - Envoyer notification FCM quand une notification est créée
 */
export const onNotificationCreated = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap) => {
    try {
      const notification = snap.data();
      const userId = notification.userId;

      // Récupérer les infos utilisateur
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData || !userData.email) {
        console.warn(`Pas d'email pour l'utilisateur ${userId}`);
        return;
      }

      // Vérifier les préférences de notification
      if (userData.emailNotifications === false) {
        console.log(`Notifications email désactivées pour ${userId}`);
        return;
      }

      console.log(`Envoi notification à ${userData.email}`);

      const transporter = getEmailTransporter();
      if (!transporter) {
        console.log('Notification simulée');
        return;
      }

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: userData.email,
        subject: notification.title || 'Nouvelle notification',
        html: `<p>${notification.message || 'Vous avez une nouvelle notification'}</p>`
      });

      console.log(`Notification envoyée à ${userData.email}`);
    } catch (error) {
      console.error('Erreur notification:', error);
    }
  });

/**
 * Trigger Firestore - Envoyer un email quand une correspondance est créée
 */
export const onMatchCreated = functions.firestore
  .document('matches/{matchId}')
  .onCreate(async (snap) => {
    try {
      const match = snap.data();
      const userId = match.userId;

      // Récupérer les infos utilisateur
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData || !userData.email) {
        console.warn(`Pas d'email pour l'utilisateur ${userId}`);
        return;
      }

      // Vérifier les préférences
      if (userData.emailNotifications === false) {
        console.log(`Notifications email désactivées pour ${userId}`);
        return;
      }

      const transporter = getEmailTransporter();
      if (!transporter) {
        console.log('Email de correspondance simulé');
        return;
      }

      // Récupérer les déclarations pour plus de détails
      const dec1 = await admin.firestore().collection('declarations').doc(match.declarationId1).get();
      const dec2 = await admin.firestore().collection('declarations').doc(match.declarationId2).get();

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { font-size: 28px; font-weight: bold; color: #16a34a; }
            .match-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; margin: 16px 0; font-weight: bold; }
            .title { font-size: 20px; font-weight: 600; color: #166534; margin: 16px 0; }
            .object-info { background: #f0fdf4; padding: 16px; border-radius: 6px; margin: 16px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
            .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">Found Again</div>
              </div>
              <div class="match-badge">CORRESPONDANCE TROUVÉE!</div>
              <h1 class="title">Bonne nouvelle - Correspondance détectée!</h1>
              <p>Nous avons trouvé une correspondance potentielle pour votre déclaration.</p>
              
              <div class="object-info">
                <strong>Votre objet:</strong><br/>
                ${dec1.exists ? dec1.data()?.objectName || 'Objet' : 'Objet'}<br/><br/>
                <strong>Correspondance trouvée:</strong><br/>
                ${dec2.exists ? dec2.data()?.objectName || 'Objet' : 'Objet'}<br/><br/>
                <strong>Confiance:</strong> ${(match.confidence * 100).toFixed(0)}%
              </div>

              <p>Consultez les détails et contactez l'autre utilisateur pour confirmer la correspondance.</p>
              <a href="https://found-again.web.app/dashboard/matches/${match.matchId}" class="button">Voir la correspondance</a>
            </div>
            <div class="footer">
              <p>© 2025 Found Again. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: userData.email,
        subject: 'Correspondance trouvée sur Found Again!',
        html: htmlContent
      });

      console.log(`Email de correspondance envoyé à ${userData.email}`);

      // Logger dans Firestore
      await admin.firestore().collection('emailLogs').add({
        userId: userId,
        recipient: userData.email,
        subject: 'Correspondance trouvée',
        type: 'match',
        status: 'sent',
        sentAt: admin.firestore.Timestamp.now(),
        matchId: match.matchId,
        confidence: match.confidence
      });
    } catch (error) {
      console.error('Erreur envoi email correspondance:', error);
    }
  });

/**
 * Trigger Firestore - Envoyer un email quand une vérification est complétée
 */
export const onVerificationCompleted = functions.firestore
  .document('verifications/{verificationId}')
  .onUpdate(async (change) => {
    try {
      const before = change.before.data();
      const after = change.after.data();

      // Vérifier si le statut est passé à 'approved'
      if (before.status !== 'approved' && after.status === 'approved') {
        const userId = after.userId;

        // Récupérer les infos utilisateur
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (!userData || !userData.email) {
          console.warn(`Pas d'email pour l'utilisateur ${userId}`);
          return;
        }

        // Vérifier les préférences
        if (userData.emailNotifications === false) {
          console.log(`Notifications email désactivées pour ${userId}`);
          return;
        }

        const transporter = getEmailTransporter();
        if (!transporter) {
          console.log('Email de vérification simulé');
          return;
        }

        const htmlContent = `
          <!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
              .card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 24px; }
              .logo { font-size: 28px; font-weight: bold; color: #16a34a; }
              .success-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; margin: 16px 0; font-weight: bold; }
              .title { font-size: 20px; font-weight: 600; color: #166534; margin: 16px 0; }
              .button { display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
              .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <div class="logo">Found Again</div>
                </div>
                <div class="success-badge">IDENTITÉ VÉRIFIÉE</div>
                <h1 class="title">Félicitations! Votre identité a été vérifiée</h1>
                <p>Votre compte a maintenant accès à toutes les fonctionnalités de Found Again.</p>
                <p>Vous pouvez maintenant:</p>
                <ul>
                  <li>Créer et gérer des déclarations</li>
                  <li>Voir les correspondances potentielles</li>
                  <li>Contacter d'autres utilisateurs</li>
                  <li>Participer aux vérifications</li>
                </ul>
                <a href="https://found-again.web.app/dashboard" class="button">Accéder au tableau de bord</a>
              </div>
              <div class="footer">
                <p>© 2025 Found Again. Tous droits réservés.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: userData.email,
          subject: 'Identité vérifiée - Bienvenue sur Found Again!',
          html: htmlContent
        });

        console.log(`Email de vérification envoyé à ${userData.email}`);

        // Logger
        await admin.firestore().collection('emailLogs').add({
          userId: userId,
          recipient: userData.email,
          subject: 'Identité vérifiée',
          type: 'verification',
          status: 'sent',
          sentAt: admin.firestore.Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Erreur email vérification:', error);
    }
  });

/**
 * Trigger Firestore - Envoyer un email quand le statut d'une déclaration change
 */
export const onDeclarationStatusChanged = functions.firestore
  .document('declarations/{declarationId}')
  .onUpdate(async (change) => {
    try {
      const before = change.before.data();
      const after = change.after.data();

      // Vérifier si le statut a changé
      if (before.status === after.status) {
        return;
      }

      const userId = after.userId;

      // Récupérer les infos utilisateur
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData || !userData.email) {
        console.warn(`Pas d'email pour l'utilisateur ${userId}`);
        return;
      }

      // Vérifier les préférences
      if (userData.emailNotifications === false) {
        console.log(`Notifications email désactivées pour ${userId}`);
        return;
      }

      const transporter = getEmailTransporter();
      if (!transporter) {
        console.log('Email de mise à jour simulé');
        return;
      }

      const statusMessages: { [key: string]: string } = {
        'active': 'Votre déclaration est maintenant active',
        'resolved': 'Votre déclaration a été marquée comme résolue',
        'closed': 'Votre déclaration a été fermée',
        'archived': 'Votre déclaration a été archivée'
      };

      const statusEmojis: { [key: string]: string } = {
        'active': '',
        'resolved': '',
        'closed': '',
        'archived': ''
      };

      const statusMessage = statusMessages[after.status] || `Statut: ${after.status}`;
      const emoji = statusEmojis[after.status] || '';

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { font-size: 28px; font-weight: bold; color: #16a34a; }
            .status-badge { display: inline-block; background: #f3f4f6; color: #1f2937; padding: 8px 16px; border-radius: 20px; margin: 16px 0; font-weight: bold; font-size: 18px; }
            .title { font-size: 20px; font-weight: 600; margin: 16px 0; }
            .object-info { background: #f0fdf4; padding: 16px; border-radius: 6px; margin: 16px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
            .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">Found Again</div>
              </div>
              <div class="status-badge">${emoji} ${after.status.toUpperCase()}</div>
              <h1 class="title">${statusMessage}</h1>
              
              <div class="object-info">
                <strong>Objet:</strong><br/>
                ${after.objectName || 'Objet'}<br/><br/>
                <strong>Type:</strong><br/>
                ${after.type === 'found' ? 'Objet trouvé' : 'Objet perdu'}<br/><br/>
                <strong>Nouveau statut:</strong><br/>
                ${after.status}
              </div>

              <p>Cliquez ci-dessous pour consulter les détails de votre déclaration et les correspondances potentielles.</p>
              <a href="https://found-again.web.app/declarations/${change.after.id}" class="button">Voir la déclaration</a>
            </div>
            <div class="footer">
              <p>© 2025 Found Again. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: userData.email,
        subject: `${emoji} Mise à jour: ${after.objectName}`,
        html: htmlContent
      });

      console.log(`Email de mise à jour envoyé à ${userData.email}`);

      // Logger
      await admin.firestore().collection('emailLogs').add({
        userId: userId,
        recipient: userData.email,
        subject: `Mise à jour déclaration: ${after.objectName}`,
        type: 'update',
        status: 'sent',
        sentAt: admin.firestore.Timestamp.now(),
        declarationId: change.after.id,
        oldStatus: before.status,
        newStatus: after.status
      });
    } catch (error) {
      console.error('Erreur email mise à jour:', error);
    }
  });

/**
 * Utilitaires
 */
function generateEmailHTML(params: EmailParams): string {
  const data = params.templateData || {};
  const baseURL = 'https://found-again.web.app';

  // Couleurs par type
  const typeColors: { [key: string]: string } = {
    'notification': '#16a34a',
    'verification': '#059669',
    'match': '#0891b2',
    'update': '#7c3aed',
    'alert': '#dc2626'
  };

  const color = typeColors[params.type] || '#16a34a';

  const template = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; background: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 40px 20px; text-align: center; color: white; }
        .logo { font-size: 32px; margin-bottom: 12px; }
        .header-title { font-size: 24px; font-weight: 600; margin-top: 12px; }
        .content { padding: 32px 24px; }
        .title { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
        .message { font-size: 16px; color: #555; margin-bottom: 24px; line-height: 1.8; }
        .info-box { background: #f9fafb; border-left: 4px solid ${color}; padding: 16px; border-radius: 6px; margin: 24px 0; }
        .info-box strong { color: #1f2937; display: block; margin-bottom: 8px; }
        .button { display: inline-block; padding: 14px 28px; background: ${color}; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 24px; transition: opacity 0.3s; }
        .button:hover { opacity: 0.9; }
        .footer { background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        .footer a { color: ${color}; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <div class="logo"></div>
            <div class="header-title">${data.title || params.subject}</div>
          </div>
          <div class="content">
            <p class="message">${data.message || 'Vous avez une nouvelle notification Found Again'}</p>
            ${data.additionalInfo ? `<div class="info-box">${data.additionalInfo}</div>` : ''}
            ${data.actionUrl ? `<center><a href="${baseURL}${data.actionUrl}" class="button">Voir plus</a></center>` : ''}
          </div>
          <div class="footer">
            <p>© 2025 Found Again. Tous droits réservés.</p>
            <p><a href="${baseURL}/profile?tab=notifications">Gérer vos préférences de notification</a></p>
            <p style="margin-top: 8px; font-size: 11px;">Si vous ne souhaitez plus recevoir ces emails, vous pouvez désactiver les notifications dans vos paramètres.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return template;
}

/**
 * Trigger Firestore pour envoyer un email lors d'une demande de contact
 */
export const onContactRequestCreated = functions.firestore
  .document('contact_requests/{requestId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const requestId = context.params.requestId;

    console.log(`Nouvelle demande de contact reçue: ${requestId}`);

    const transporter = getEmailTransporter();
    
    // Email de destination (admin)
    // Si ADMIN_EMAIL n'est pas défini, on s'envoie l'email à soi-même (GMAIL_USER)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!transporter || !adminEmail) {
      console.log('Email simulé pour contact request:', data);
      return null;
    }

    const mailOptions = {
      from: `"Found Again Contact" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      replyTo: data.email, // Pour répondre directement à l'utilisateur
      subject: `[Contact] ${data.subject} - ${data.name}`,
      html: `
        <h2>Nouvelle demande de contact</h2>
        <p><strong>De:</strong> ${data.name} (${data.email})</p>
        <p><strong>Sujet:</strong> ${data.subject}</p>
        <hr/>
        <p><strong>Message:</strong></p>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
        <hr/>
        <p><small>ID de la demande: ${requestId}</small></p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email de contact envoyé à l\'admin');
      
      // Mettre à jour le statut si nécessaire
      await snapshot.ref.update({ 
        emailSent: true,
        emailSentAt: admin.firestore.Timestamp.now()
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de contact:', error);
      await snapshot.ref.update({ 
        emailSent: false,
        emailError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return null;
  });

/**
 * Trigger Firestore - Envoyer un email quand une vérification est mise à jour (validée ou rejetée)
 */
export const onVerificationUpdated = functions.firestore
    .document("declarations/{declarationId}/verifications/{verificationId}")
    .onUpdate(async (change, context) => {
    
    const newData = change.after.data();
    const previousData = change.before.data();

    // Si le statut n'a pas changé, on ne fait rien
    if (newData.status === previousData.status) {
        return null;
    }

    const declarationId = context.params.declarationId;
    const verificationId = context.params.verificationId;
    const claimantUserId = newData.userId; // L'utilisateur qui a fait la demande

    console.log(`Vérification ${verificationId} mise à jour : ${previousData.status} -> ${newData.status}`);

    try {
        // 1. Récupérer la déclaration
        const declarationSnapshot = await admin.firestore().collection('declarations').doc(declarationId).get();
        if (!declarationSnapshot.exists) {
            console.error('Déclaration introuvable');
            return null;
        }
        const declarationData = declarationSnapshot.data();

        // 2. Récupérer les infos du propriétaire (pour lui envoyer l'email)
        const claimantSnapshot = await admin.firestore().collection('users').doc(claimantUserId).get();
        const claimantData = claimantSnapshot.data();
        const claimantEmail = claimantData?.email;

        if (!claimantEmail) {
            console.error('Email du demandeur introuvable');
            return null;
        }

        const transporter = getEmailTransporter();
        
        // CAS 1 : VALIDATION
        if (newData.status === 'verified') {
            const finderUserId = declarationData?.userId;
            if (!finderUserId) {
                console.error('Trouveur introuvable');
                return null;
            }

            const finderSnapshot = await admin.firestore().collection('users').doc(finderUserId).get();
            const finderData = finderSnapshot.data();

            if (!finderData) {
                console.error('Données du trouveur manquantes');
                return null;
            }

            // Déterminer l'URL d'action (carte avec coordonnées si disponibles)
            // NOTE: On utilise les coordonnées du trouveur (détenteur de l'objet) et non celles de la déclaration (lieu de trouvaille)
            let actionUrl = `/found-object/${declarationId}`;
            
            if (finderData.coordinates) {
                const { lat, lng } = finderData.coordinates;
                actionUrl = `/map-view?lat=${lat}&lng=${lng}`;
            }

            // 1. Créer la notification
            await admin.firestore().collection('notifications').add({
                userId: claimantUserId,
                title: 'Vérification validée',
                message: `Votre demande de vérification pour l'objet "${declarationData?.title || 'Objet'}" a été validée.`,
                type: 'success',
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                actionUrl: actionUrl,
                data: { declarationId, verificationId }
            });

            // 2. Envoyer l'email
            if (transporter) {
                const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="fr">
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
                            .card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                            .header { text-align: center; margin-bottom: 24px; }
                            .logo { font-size: 28px; font-weight: bold; color: #16a34a; }
                            .title { font-size: 20px; font-weight: 600; color: #166534; margin: 16px 0; }
                            .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 16px 0; }
                            .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #999; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="card">
                                <div class="header">
                                    <div class="logo">Found Again</div>
                                </div>
                                <h1 class="title">Vérification validée !</h1>
                                
                                <p>Bonne nouvelle ! Votre demande de vérification pour l'objet <strong>${declarationData?.title || 'Objet'}</strong> a été validée.</p>
                                
                                <p>Voici les coordonnées de la personne qui a trouvé votre objet :</p>
                                
                                <div class="info-box">
                                    <p><strong>Nom :</strong> ${finderData.firstname} ${finderData.lastname}</p>
                                    <p><strong>Email :</strong> ${finderData.email}</p>
                                    ${finderData.phone ? `<p><strong>Téléphone :</strong> ${finderData.phone}</p>` : ''}
                                </div>
                                
                                <p>Vous pouvez maintenant prendre contact pour récupérer votre objet.</p>
                                
                                <p>Cordialement,</p>
                                <p>L'équipe Found Again</p>
                            </div>
                            <div class="footer">
                                <p>© 2025 Found Again. Tous droits réservés.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                await transporter.sendMail({
                    from: process.env.GMAIL_USER,
                    to: claimantEmail,
                    subject: 'Votre objet a été retrouvé ! - Found Again',
                    html: htmlContent
                });
            } else {
                console.log('Email simulé (pas de SMTP):', { to: claimantEmail, status: newData.status });
            }
        }
        
        // CAS 2 : REJET
        else if (newData.status === 'rejected') {
            const rejectionReason = newData.rejectionReason || 'Informations insuffisantes.';
            
            // 1. Créer la notification
            await admin.firestore().collection('notifications').add({
                userId: claimantUserId,
                title: 'Vérification refusée',
                message: `Votre demande de vérification pour l'objet "${declarationData?.title || 'Objet'}" a été refusée.`,
                type: 'error',
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                actionUrl: `/found-object/${declarationId}`,
                data: { declarationId, verificationId, rejectionReason }
            });

            // 2. Envoyer l'email
            if (transporter) {
                const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="fr">
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
                            .card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                            .header { text-align: center; margin-bottom: 24px; }
                            .logo { font-size: 28px; font-weight: bold; color: #16a34a; }
                            .title { font-size: 20px; font-weight: 600; color: #dc2626; margin: 16px 0; }
                            .info-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 16px 0; }
                            .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #999; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="card">
                                <div class="header">
                                    <div class="logo">Found Again</div>
                                </div>
                                <h1 class="title">Vérification refusée</h1>
                                
                                <p>Nous sommes désolés, mais votre demande de vérification pour l'objet <strong>${declarationData?.title || 'Objet'}</strong> n'a pas pu être validée.</p>
                                
                                <div class="info-box">
                                    <p><strong>Raison du refus :</strong></p>
                                    <p>${rejectionReason}</p>
                                </div>
                                
                                <p>Si vous pensez qu'il s'agit d'une erreur, vous pouvez soumettre une nouvelle demande avec plus de détails ou de preuves.</p>
                                
                                <p>Cordialement,</p>
                                <p>L'équipe Found Again</p>
                            </div>
                            <div class="footer">
                                <p>© 2025 Found Again. Tous droits réservés.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                await transporter.sendMail({
                    from: process.env.GMAIL_USER,
                    to: claimantEmail,
                    subject: 'Mise à jour de votre demande de vérification - Found Again',
                    html: htmlContent
                });
            } else {
                console.log('Email simulé (pas de SMTP):', { to: claimantEmail, status: newData.status });
            }
        }

        console.log(`Email de notification envoyé à ${claimantEmail} pour le statut ${newData.status}`);

    } catch (error) {
        console.error('Erreur lors du traitement de la mise à jour de vérification:', error);
    }
    return null;
});
