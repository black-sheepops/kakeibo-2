// hooks/useKakeibo.ts
import { useState, useEffect } from 'react';
import { fetchRecords, deleteRecord } from '../lib/api';

export const useKakeibo = (targetYear: number, targetMonth: number) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await fetchRecords(targetYear, targetMonth); 
      setRecords(data || []);
    } finally {
      setLoading(false);
    }
  };

  const removeRecord = async (id: number) => {
    await deleteRecord(id);
    await loadRecords();
  };

  useEffect(() => {
    loadRecords();
  }, [targetYear, targetMonth]);

  return { records, loadRecords, removeRecord, loading };
};