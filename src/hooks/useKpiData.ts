import { useEffect, useState } from 'react';
import Papa from 'papaparse';

export type KpiRow = Record<string, string>;

interface UseKpiDataResult {
  rows: KpiRow[];
  loading: boolean;
  error: string | null;
}

export function useKpiData(): UseKpiDataResult {
  const [rows, setRows] = useState<KpiRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Papa.parse<KpiRow>('/data/tractor_kpi_input.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setRows(result.data);
        setLoading(false);
      },
      error: (err) => {
        setError(err.message || 'Unable to read KPI CSV file');
        setLoading(false);
      },
    });
  }, []);

  return {
    rows,
    loading,
    error,
  };
}