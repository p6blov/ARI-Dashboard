import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { Resend } from 'resend';

admin.initializeApp();
const db = admin.firestore();

/**
 * Send an email invitation with a secure one-time token.
 * Only callable by authenticated users with role > 2.
 */
exports.sendInvitation = onRequest({ cors: true, secrets: ['RESEND_API_KEY'] }, async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const callerDoc = await db.collection('users').doc(decoded.uid).get();
  if (!callerDoc.exists || (callerDoc.data()?.role ?? 0) <= 2) {
    res.status(403).json({ error: 'Insufficient role to send invitations.' });
    return;
  }

  const { email } = req.body as { email: string };
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }

  const inviteToken = crypto.randomUUID();
  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 48 * 60 * 60 * 1000);

  await db.collection('invitations').doc(inviteToken).set({
    email,
    token: inviteToken,
    createdAt: now,
    expiresAt,
    used: false,
    createdBy: decoded.uid,
  });

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    res.status(500).json({ error: 'Email service not configured. Set RESEND_API_KEY secret.' });
    return;
  }

  const resend = new Resend(resendApiKey);
  const appUrl = process.env.APP_URL || 'https://aero-rocket-inventory.vercel.app';
  const inviteUrl = `${appUrl}/invite?token=${inviteToken}`;

  await resend.emails.send({
    from: 'ARI Dashboard <noreply@fiuseds.com>',
    to: email,
    subject: 'Create your ARI Account',
    html: `<p>Follow the link below to create your account:</p><p><a href="${inviteUrl}">${inviteUrl}</a></p><p>This link expires in 48 hours.</p>`,
  });

  res.json({ success: true });
});

/**
 * Create a new user account without signing out the caller.
 * Only callable by authenticated users with role > 2.
 */
exports.createManagedUser = onRequest({ cors: true }, async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const callerDoc = await db.collection('users').doc(decoded.uid).get();
  if (!callerDoc.exists || (callerDoc.data()?.role ?? 0) <= 2) {
    res.status(403).json({ error: 'Insufficient role to create users.' });
    return;
  }

  const { email, password, name, team } = req.body as {
    email: string;
    password: string;
    name: string;
    team: string;
  };

  if (!email || !password || !name || !team) {
    res.status(400).json({ error: 'email, password, name, and team are required.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  let userRecord: admin.auth.UserRecord;
  try {
    userRecord = await admin.auth().createUser({ email, password, displayName: name });
  } catch (err: any) {
    if (err.code === 'auth/email-already-exists') {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    res.status(500).json({ error: `Failed to create auth user: ${err.message}` });
    return;
  }

  await db.collection('users').doc(userRecord.uid).set({
    name,
    email,
    role: 1,
    team,
    userID: userRecord.uid,
  });

  res.json({ uid: userRecord.uid });
});
