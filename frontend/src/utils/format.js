export const formatNumber = (n, decimals = 0) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export function downloadCsv(rows, filename = "feedback.csv") {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = ["id,review,category", ...rows.map((r) => [r.id, r.review, r.category].map(esc).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
