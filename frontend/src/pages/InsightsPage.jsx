import { motion } from "framer-motion";
import { TrendingUp, Layers, Copy, Target, ArrowUpRight } from "lucide-react";
import PageShell from "../components/ui/PageShell";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import StateMessage from "../components/ui/StateMessage";
import { stagger } from "../lib/motion";
import { formatNumber } from "../utils/format";

// Insights are computed from the real overview numbers — nothing is invented.
function buildInsights(overview) {
  const cats = [...(overview?.categories ?? [])].sort((a, b) => b.count - a.count);
  const t = overview?.totals ?? {};
  if (!cats.length) return [];
  const [first, second] = cats;
  const dup = +(100 - (t.uniqueReviewPercentage ?? 0)).toFixed(1);
  const list = [
    { icon: TrendingUp, tone: "indigo", title: `${first.name} leads the dataset`,
      text: `${first.percentage}% of unique reviews (${formatNumber(first.count)}) fall under this category.`,
      action: "Review these records" },
    { icon: Layers, tone: "blue", title: "Category concentration",
      text: second ? `${first.name} and ${second.name} together account for ${(first.percentage + second.percentage).toFixed(1)}% of feedback.` : `All feedback sits in one category.` },
    { icon: Copy, tone: "amber", title: dup > 20 ? "High duplicate rate" : "Duplicates under control",
      text: `${dup}% of rows (${formatNumber(t.duplicateRows)}) are duplicate review/category pairs.${dup > 20 ? " Clean these before drawing conclusions." : ""}` },
    { icon: Target, tone: "green", title: `Smallest segment: ${cats[cats.length - 1].name}`,
      text: `Only ${cats[cats.length - 1].percentage}% of feedback. Check whether it is under-reported or genuinely rare.` },
  ];
  return list;
}

export default function InsightsPage({ data, onNavigate }) {
  const { overview, loading, error, reload } = data;
  const insights = buildInsights(overview);

  return (
    <PageShell title="AI Insights" subtitle="Patterns found in your feedback dataset.">
      {error ? (
        <Card><StateMessage type="error" title="Insights unavailable" text={error} onRetry={reload} /></Card>
      ) : loading ? (
        <div className="insight-grid">{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={150} radius={11} />)}</div>
      ) : insights.length === 0 ? (
        <Card><StateMessage title="Not enough data yet" text="Insights appear once categories are available." /></Card>
      ) : (
        <motion.div className="insight-grid" variants={stagger}>
          {insights.map(({ icon: Icon, tone, title, text, action }) => (
            <Card key={title} className="insight-tile">
              <div className={`metric-icon ${tone}`}><Icon size={19} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
              {action && <Button variant="ghost" onClick={() => onNavigate("feedback")}>{action} <ArrowUpRight size={15} /></Button>}
            </Card>
          ))}
        </motion.div>
      )}
    </PageShell>
  );
}
