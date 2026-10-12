export default function ChartTooltip({ active, payload, label, unit = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span>{label ?? payload[0].payload.name}</span>
      <strong>{Number(payload[0].value).toLocaleString("en-IN")}{unit}</strong>
    </div>
  );
}
