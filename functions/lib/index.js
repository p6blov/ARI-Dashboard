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
exports.sendInvitation = (0, https_1.onCall)({ secrets: ['RESEND_API_KEY'], invoker: 'public' }, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const callerUid = request.auth.uid;
    const callerDoc = await db.collection('users').doc(callerUid).get();
    if (!callerDoc.exists || ((_b = (_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== null && _b !== void 0 ? _b : 0) <= 2) {
        throw new https_1.HttpsError('permission-denied', 'Insufficient role to send invitations.');
    }
    const { email } = request.data;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        throw new https_1.HttpsError('invalid-argument', 'A valid email address is required.');
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
        throw new https_1.HttpsError('internal', 'Email service not configured. Set RESEND_API_KEY secret.');
    }
    const resend = new resend_1.Resend(resendApiKey);
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
exports.createManagedUser = (0, https_1.onCall)({ invoker: 'public' }, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const callerUid = request.auth.uid;
    const callerDoc = await db.collection('users').doc(callerUid).get();
    if (!callerDoc.exists || ((_b = (_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== null && _b !== void 0 ? _b : 0) <= 2) {
        throw new https_1.HttpsError('permission-denied', 'Insufficient role to create users.');
    }
    const { email, password, name, team } = request.data;
    if (!email || !password || !name || !team) {
        throw new https_1.HttpsError('invalid-argument', 'email, password, name, and team are required.');
    }
    if (password.length < 6) {
        throw new https_1.HttpsError('invalid-argument', 'Password must be at least 6 characters.');
    }
    let userRecord;
    try {
        userRecord = await admin.auth().createUser({ email, password, displayName: name });
    }
    catch (err) {
        if (err.code === 'auth/email-already-exists') {
            throw new https_1.HttpsError('already-exists', 'An account with this email already exists.');
        }
        throw new https_1.HttpsError('internal', `Failed to create auth user: ${err.message}`);
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
//# sourceMappingURL=index.js.map