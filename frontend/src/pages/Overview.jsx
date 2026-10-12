import { motion } from "framer-motion";
import { MessageSquareText, ThumbsUp, AlertTriangle, ChartNoAxesCombined, Download, CircleCheck } from "lucide-react";
import PageShell from "../components/ui/PageShell";
import Button from "../components/ui/Button";
import Card, { CardHeader } from "../components/ui/Card";
import Skeleton from "../components/ui/Skeleton";
import StateMessage from "../components/ui/StateMessage";
import MetricCard from "../components/dashboard/MetricCard";
import InsightBanner from "../components/dashboard/InsightBanner";
import ActivityChart from "../components/dashboard/ActivityChart";
import CategoryDonut from "../components/dashboard/CategoryDonut";
import FeedbackTable from "../components/dashboard/FeedbackTable";
import { stagger } from "../lib/motion";
import { downloadCsv, formatNumber } from "../utils/format";
import AnalysisPanel from "../components/analysis/AnalysisPanel";

export default function Overview({ data, onNavigate }) {
  const { overview, feedback, loading, error, reload } = data;
  const t = overview?.totals ?? {};
  const categories = overview?.categories ?? [];
  const uniquePct = t.uniqueReviewPercentage ?? 0;
  const top = [...categories].sort((a, b) => b.count - a.count)[0];

  return (
    <PageShell
      title="Overview"
      subtitle="Here's what's happening with your customer feedback."
      actions={<Button icon={Download} disabled={!feedback.length} onClick={() => downloadCsv(feedback)}>Export report</Button>}
    >
      {error && <Card><StateMessage type="error" title="Dashboard data unavailable" text={error} onRetry={reload} /></Card>}

      <motion.section variants={stagger} className="metrics-grid">
        <MetricCard loading={loading} title="Total feedback rows" value={t.totalRows ?? 0} change={`${formatNumber(t.uniqueReviews)} unique`} icon={MessageSquareText} tone="indigo" note="review/category pairs" />
        <MetricCard loading={loading} title="Unique feedback" value={t.uniqueReviews ?? 0} change={`${uniquePct}%`} icon={ThumbsUp} tone="green" note="of all dataset rows" />
        <MetricCard loading={loading} title="Duplicate rows" value={t.duplicateRows ?? 0} change={`${(100 - uniquePct).toFixed(1)}%`} positive={false} icon={AlertTriangle} tone="amber" note="of all dataset rows" />
        <MetricCard loading={loading} title="Categories" value={categories.length} change="Dataset labels" icon={ChartNoAxesCombined} tone="blue" note="available categories" />
      </motion.section>

      <InsightBanner
        onExplore={() => onNavigate("insights")}
        headline={top ? `${top.name} is your largest feedback category.` : "Turn customer feedback into your next decision."}
      />

      <AnalysisPanel />

      <section className="charts-grid">
        <ActivityChart refreshKey={data.refreshKey ?? 0} />
        <CategoryDonut categories={categories} loading={loading} />
      </section>

      <Card className="feedback-panel">
        <CardHeader
          title="Recent feedback"
          subtitle="Latest messages from your dataset. Click a row to expand it."
          action={<Button variant="ghost" onClick={() => onNavigate("feedback")}>View all</Button>}
        />
        {loading ? (
          <div className="skeleton-rows">{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={38} />)}</div>
        ) : feedback.length === 0 ? (
          <StateMessage title="No feedback found" text="Feedback will appear here once the dataset has records." />
        ) : (
          <FeedbackTable items={feedback.slice(0, 6)} categoryNames={categories.map((c) => c.name)} />
        )}
      </Card>

      <footer className="dashboard-footer">
        <span>InsightFlow · Customer Feedback Intelligence</span>
        <span><CircleCheck size={14} />{loading ? "Loading dataset..." : error ? "Disconnected" : "Connected to dataset"}</span>
      </footer>
    </PageShell>
  );
}
