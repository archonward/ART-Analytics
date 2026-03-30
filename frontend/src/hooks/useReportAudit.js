import { useEffect, useState } from 'react';
import { API_BASE } from '../config/api';

export default function useReportAudit(enabled = true) {
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(enabled);
  const [auditError, setAuditError] = useState('');

  useEffect(() => {
    if (!enabled) {
      setAuditLoading(false);
      setAuditError('');
      return;
    }

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
  }, [enabled]);

  return {
    auditData,
    auditLoading,
    auditError
  };
}
