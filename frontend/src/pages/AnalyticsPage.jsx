import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import PageShell from "../components/ui/PageShell";
import Card, { CardHeader } from "../components/ui/Card";
import Skeleton from "../components/ui/Skeleton";
import StateMessage from "../components/ui/StateMessage";
import ChartTooltip from "../components/ui/ChartTooltip";
import { getCategoryColor } from "../utils/colors";
import { formatNumber } from "../utils/format";

// Chart colors matched to the light theme in app.css
const CHART = {
  grid: "#e3e8e6",
  axisMuted: "#6b7782",
  axisLabel: "#3b4955",
  cursor: "#2f7f8212",
  unique: "#1f9d6b",
  duplicate: "#c58a1d",
};

function ProgressRow({ label, value, color, suffix = "%" }) {
  return (
    <div className="progress-row">
      <div><span>{label}</span><strong>{value}{suffix}</strong></div>
      <div className="progress-track">
        <motion.div className="progress-fill" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${Math.min(100, value)}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage({ data }) {
  const { overview, loading, error, reload } = data;
  const t = overview?.totals ?? {};
  const rows = (overview?.categories ?? []).map((c, i) => ({ ...c, color: getCategoryColor(c.name, i) }))
    .sort((a, b) => b.count - a.count);
  const uniquePct = t.uniqueReviewPercentage ?? 0;

  return (
    <PageShell title="Analytics" subtitle="Category volume and data quality across your dataset.">
      {error ? (
        <Card><StateMessage type="error" title="Analytics unavailable" text={error} onRetry={reload} /></Card>
      ) : (
        <div className="charts-grid">
          <Card className="chart-panel">
            <CardHeader title="Reviews by category" subtitle="Number of unique reviews per label" />
            {loading ? <Skeleton height={280} style={{ marginTop: 20 }} /> : rows.length === 0 ? (
              <StateMessage title="No category data" />
            ) : (
              <div className="bar-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 16 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="4 5" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: CHART.axisMuted, fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={130} axisLine={false} tickLine={false} tick={{ fill: CHART.axisLabel, fontSize: 12 }} />
                    <Tooltip content={<ChartTooltip unit=" reviews" />} cursor={{ fill: CHART.cursor }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={26} animationDuration={900}>
                      {rows.map((r) => <Cell key={r.name} fill={r.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="category-panel">
            <CardHeader title="Data quality" subtitle={`${formatNumber(t.totalRows)} rows analysed`} />
            {loading ? <Skeleton height={120} style={{ marginTop: 20 }} /> : (
              <div className="progress-list">
                <ProgressRow label="Unique rows" value={uniquePct} color={CHART.unique} />
                <ProgressRow label="Duplicate rows" value={Number((100 - uniquePct).toFixed(1))} color={CHART.duplicate} />
                {rows.map((r) => <ProgressRow key={r.name} label={r.name} value={r.percentage} color={r.color} />)}
              </div>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}