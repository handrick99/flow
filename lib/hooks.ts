import { useCallback, useEffect, useState } from 'react';
import { AppData } from './types';
import { loadData, saveData } from './storage';

export function useAppData() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const update = useCallback(async (updater: (prev: AppData) => AppData | Promise<AppData>) => {
    setData((prev) => {
      if (!prev) return prev;
      const result = updater(prev);
      if (result instanceof Promise) {
        result.then(setData);
        return prev;
      }
      saveData(result);
      return result;
    });
  }, []);

  const refresh = useCallback(async () => {
    const d = await loadData();
    setData(d);
  }, []);

  const setAndSave = useCallback(async (next: AppData) => {
    await saveData(next);
    setData(next);
  }, []);

  return { data, loading, update, refresh, setAndSave };
}

export function useTimerTick(active: boolean) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
}
