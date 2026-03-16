"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const resend_1 = require("resend");
admin.initializeApp();
const db = admin.firestore();
/**
 * Send an email invitation with a secure one-time token.
 * Only callable by authenticated users with role > 2.
 */
exports.sendInvitation = (0, https_1.onRequest)({ cors: true, secrets: ['RESEND_API_KEY'] }, async (req, res) => {
    var _a, _b, _c;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split('Bearer ')[1];
    if (!token) {
        res.status(401).json({ error: 'Unauthenticated' });
        return;
    }
    let decoded;
    try {
        decoded = await admin.auth().verifyIdToken(token);
    }
    catch (_d) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
    const callerDoc = await db.collection('users').doc(decoded.uid).get();
    if (!callerDoc.exists || ((_c = (_b = callerDoc.data()) === null || _b === void 0 ? void 0 : _b.role) !== null && _c !== void 0 ? _c : 0) <= 2) {
        res.status(403).json({ error: 'Insufficient role to send invitations.' });
        return;
    }
    const { email } = req.body;
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
    const resend = new resend_1.Resend(resendApiKey);
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
exports.createManagedUser = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    var _a, _b, _c;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split('Bearer ')[1];
    if (!token) {
        res.status(401).json({ error: 'Unauthenticated' });
        return;
    }
    let decoded;
    try {
        decoded = await admin.auth().verifyIdToken(token);
    }
    catch (_d) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
    const callerDoc = await db.collection('users').doc(decoded.uid).get();
    if (!callerDoc.exists || ((_c = (_b = callerDoc.data()) === null || _b === void 0 ? void 0 : _b.role) !== null && _c !== void 0 ? _c : 0) <= 2) {
        res.status(403).json({ error: 'Insufficient role to create users.' });
        return;
    }
    const { email, password, name, team } = req.body;
    if (!email || !password || !name || !team) {
        res.status(400).json({ error: 'email, password, name, and team are required.' });
        return;
    }
    if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters.' });
        return;
    }
    let userRecord;
    try {
        userRecord = await admin.auth().createUser({ email, password, displayName: name });
    }
    catch (err) {
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
//# sourceMappingURL=index.js.map