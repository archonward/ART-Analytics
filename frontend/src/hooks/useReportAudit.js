import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function useReportAudit() {
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState('');

  useEffect(() => {
    async function loadAudit() {
      try {
        setAuditLoading(true);
        setAuditError('');

        const response = await fetch(`${API_BASE}/api/report-audit`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Could not load report audit.');
        }

        setAuditData(data);
      } catch (err) {
        setAuditError(err.message);
      } finally {
        setAuditLoading(false);
      }
    }

    loadAudit();
  }, []);

  return {
    auditData,
    auditLoading,
    auditError
  };
}