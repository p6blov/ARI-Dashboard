import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface CabinetDimensions {
  rows: number;
  cols: number;
  label: string;
}

export interface CabinetConfig {
  [cabinetKey: string]: CabinetDimensions;
}

const DEFAULT_CONFIG: CabinetConfig = {
  cab1: { rows: 6, cols: 4, label: 'Cabinet 1' },
  cab2: { rows: 6, cols: 4, label: 'Cabinet 2' },
  cab3: { rows: 6, cols: 4, label: 'Cabinet 3' },
  cab4: { rows: 6, cols: 4, label: 'Cabinet 4' },
  cab5: { rows: 6, cols: 4, label: 'Cabinet 5' },
};

export async function getCabinetConfig(): Promise<CabinetConfig> {
  try {
    const snap = await getDoc(doc(db, 'metadata', 'cabinets'));
    if (!snap.exists()) return DEFAULT_CONFIG;
    return snap.data() as CabinetConfig;
  } catch (error) {
    console.error('Error fetching cabinet config:', error);
    return DEFAULT_CONFIG;
  }
}

export async function updateCabinetConfig(config: CabinetConfig): Promise<void> {
  await setDoc(doc(db, 'metadata', 'cabinets'), config);
}
