import { getAuth } from 'firebase/auth';

async function callFunction(name: string, body: object) {
  const token = await getAuth().currentUser?.getIdToken();
  const url = `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/${name}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function sendInvitation(email: string): Promise<void> {
  await callFunction('sendInvitation', { email });
}

export async function createManagedUser(data: {
  email: string;
  password: string;
  name: string;
  team: string;
}): Promise<{ uid: string }> {
  return callFunction('createManagedUser', data);
}
