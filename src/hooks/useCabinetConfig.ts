import { useState, useEffect } from 'react';
import { getCabinetConfig, CabinetConfig } from '../services/cabinetService';

export function useCabinetConfig(): CabinetConfig | null {
  const [config, setConfig] = useState<CabinetConfig | null>(null);
  useEffect(() => {
    getCabinetConfig().then(setConfig);
  }, []);
  return config;
}
