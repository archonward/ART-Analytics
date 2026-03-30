const showAuditSectionEnv = import.meta.env.VITE_SHOW_AUDIT_SECTION;

export const SHOW_AUDIT_SECTION =
  showAuditSectionEnv === undefined ? false : showAuditSectionEnv === 'true';
