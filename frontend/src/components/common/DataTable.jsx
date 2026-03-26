export default function DataTable({ table }) {
  if (!table || !table.columns || !table.rows) {
    return null;
  }

  return (
    <div className="table-wrap">
      {table.title && <h4 className="table-title">{table.title}</h4>}
      <table className="report-table">
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={column}>{column}</th>
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
  );
}