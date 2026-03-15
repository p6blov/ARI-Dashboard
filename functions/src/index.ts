import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Resend } from 'resend';

admin.initializeApp();
const db = admin.firestore();

/**
 * Send an email invitation with a secure one-time token.
 * Only callable by authenticated users with role > 2.
 */
exports.sendInvitation = onCall({ secrets: ['RESEND_API_KEY'], invoker: 'public' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const callerUid = request.auth.uid;
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists || (callerDoc.data()?.role ?? 0) <= 2) {
    throw new HttpsError('permission-denied', 'Insufficient role to send invitations.');
  }

  const { email } = request.data as { email: string };
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'A valid email address is required.');
  }

  const token = crypto.randomUUID();
  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 48 * 60 * 60 * 1000);

  await db.collection('invitations').doc(token).set({
    email,
    token,
    createdAt: now,
    expiresAt,
    used: false,
    createdBy: callerUid,
  });

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new HttpsError('internal', 'Email service not configured. Set RESEND_API_KEY secret.');
  }

  const resend = new Resend(resendApiKey);
  const appUrl = process.env.APP_URL || 'https://aero-rocket-inventory.vercel.app';
  const inviteUrl = `${appUrl}/invite?token=${token}`;

  await resend.emails.send({
    from: 'ARI Dashboard <noreply@fiuseds.com>',
    to: email,
    subject: 'Create your ARI Account',
    html: `<p>Follow the link below to create your account:</p><p><a href="${inviteUrl}">${inviteUrl}</a></p><p>This link expires in 48 hours.</p>`,
  });

  return { success: true };
});

/**
 * Create a new user account without signing out the caller.
 * Only callable by authenticated users with role > 2.
 */
exports.createManagedUser = onCall({ invoker: 'public' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const callerUid = request.auth.uid;
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists || (callerDoc.data()?.role ?? 0) <= 2) {
    throw new HttpsError('permission-denied', 'Insufficient role to create users.');
  }

  const { email, password, name, team } = request.data as {
    email: string;
    password: string;
    name: string;
    team: string;
  };

  if (!email || !password || !name || !team) {
    throw new HttpsError('invalid-argument', 'email, password, name, and team are required.');
  }
  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'Password must be at least 6 characters.');
  }

  let userRecord: admin.auth.UserRecord;
  try {
    userRecord = await admin.auth().createUser({ email, password, displayName: name });
  } catch (err: any) {
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'An account with this email already exists.');
    }
    throw new HttpsError('internal', `Failed to create auth user: ${err.message}`);
  }

  await db.collection('users').doc(userRecord.uid).set({
    name,
    email,
    role: 1,
    team,
    userID: userRecord.uid,
  });

  return { uid: userRecord.uid };
});
