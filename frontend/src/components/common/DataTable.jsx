export default function DataTable({ table, suppressTitle = false }) {
  if (!table || !table.columns || !table.rows) {
    return null;
  }

  const shouldShowTitle = !suppressTitle && table.title && table.title.trim() !== '';

  return (
    <div className="table-wrap">
      {shouldShowTitle && <h4 className="table-title">{table.title}</h4>}
      <div className="table-scroll">
        <table className="report-table">
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th key={column} scope="col">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`${table.title || 'table'}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
