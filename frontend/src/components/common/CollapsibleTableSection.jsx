import { useState } from 'react';
import DataTable from './DataTable';

export default function CollapsibleTableSection({
  title,
  table,
  suppressTitle = false
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!table || !table.columns || !table.rows) {
    return null;
  }

  return (
    <div className="collapsible-table-section">
      <button
        type="button"
        className="collapsible-table-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <span className={`collapsible-table-chevron ${isOpen ? 'collapsible-table-chevron-open' : ''}`}>
          v
        </span>
      </button>

      {isOpen && (
        <div className="collapsible-table-content">
          <DataTable table={table} suppressTitle={suppressTitle} />
        </div>
      )}
    </div>
  );
}
