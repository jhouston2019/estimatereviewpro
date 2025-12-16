interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
}

export function DataTable({ columns, data, emptyMessage = "No data available" }: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-800 text-left text-[11px] font-medium text-slate-400">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`pb-2 ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-300">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-900/50">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`py-2 ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"}`}
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

