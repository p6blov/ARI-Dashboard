import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

const functions = getFunctions(app);

export async function sendInvitation(email: string): Promise<void> {
  const fn = httpsCallable(functions, 'sendInvitation');
  await fn({ email });
}

export async function createManagedUser(data: {
  email: string;
  password: string;
  name: string;
  team: string;
}): Promise<{ uid: string }> {
  const fn = httpsCallable<typeof data, { uid: string }>(functions, 'createManagedUser');
  const result = await fn(data);
  return result.data;
}
