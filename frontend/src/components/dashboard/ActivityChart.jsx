import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import {
  Activity,
  CalendarDays,
  TrendingUp,
  BarChart3,
  MousePointer2,
} from "lucide-react";

import Card, { CardHeader } from "../ui/Card";
import Tabs from "../ui/Tabs";
import AnimatedNumber from "../ui/AnimatedNumber";
import ChartTooltip from "../ui/ChartTooltip";
import StateMessage from "../ui/StateMessage";
import { getFeedbackActivity } from "../../api/api";

const ranges = ["7D", "30D", "90D"];

// Chart colors matched to the light theme in app.css
const CHART = {
  line: "#2f7f86",
  grid: "#e3e8e6",
  axis: "#6b7782",
  cursor: "#b9c4c0",
  dotRing: "#ffffff",
};

export default function ActivityChart({ refreshKey = 0 }) {
  const [range, setRange] = useState("7D");
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPoint, setSelectedPoint] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      setLoading(true);
      setError("");
      setSelectedPoint(null);

      try {
        const result = await getFeedbackActivity(range);

        if (!result?.success) {
          throw new Error("Unable to load feedback activity.");
        }

        if (!cancelled) {
          setActivity(Array.isArray(result.activity) ? result.activity : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load feedback activity."
          );
          setActivity([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadActivity();

    return () => {
      cancelled = true;
    };
  }, [range, refreshKey]);

  const metrics = useMemo(() => {
    const total = activity.reduce(
      (sum, item) => sum + (Number(item.feedback) || 0),
      0
    );

    const average = activity.length ? total / activity.length : 0;

    const peak = activity.reduce(
      (best, item) =>
        (Number(item.feedback) || 0) > (Number(best?.feedback) || 0)
          ? item
          : best,
      null
    );

    return {
      total,
      average,
      peak,
    };
  }, [activity]);

  function handlePointClick(point) {
    if (!point?.activePayload?.length) return;

    setSelectedPoint(point.activePayload[0].payload);
  }

  return (
    <Card className="chart-panel">
      <CardHeader
        title="Feedback activity"
        subtitle="Explore when customer feedback was recorded"
        action={
          <Tabs
            options={ranges}
            value={range}
            onChange={setRange}
          />
        }
      />

      {/* Summary metrics */}
      <div className="activity-summary">
        <SummaryMetric
          icon={Activity}
          label="Total feedback"
          value={metrics.total}
          color="tone-teal"
          loading={loading}
        />

        <SummaryMetric
          icon={BarChart3}
          label="Daily average"
          value={metrics.average}
          color="tone-blue"
          loading={loading}
          decimal
        />

        <SummaryMetric
          icon={TrendingUp}
          label="Peak activity"
          value={metrics.peak?.feedback ?? 0}
          color="tone-green"
          loading={loading}
        />
      </div>

      {/* Selected date details */}
      {selectedPoint && !loading && !error && (
        <div className="activity-selected">
          <div className="activity-selected-main">
            <CalendarDays size={16} />
            <div>
              <p className="activity-selected-label">
                {selectedPoint.label}
              </p>
              <p className="activity-selected-sub">
                Selected activity period
              </p>
            </div>
          </div>

          <div className="activity-selected-value">
            <p className="activity-selected-count">
              {Number(selectedPoint.feedback) || 0}
            </p>
            <p className="activity-selected-sub">feedback records</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {error ? (
        <div className="area-chart">
          <StateMessage
            type="error"
            title="Activity unavailable"
            text={error}
          />
        </div>
      ) : loading ? (
        <div className="area-chart activity-state">
          <p className="activity-state-text activity-loading">
            Loading activity...
          </p>
        </div>
      ) : activity.length === 0 ? (
        <div className="area-chart activity-state">
          <BarChart3 size={25} />
          <p className="activity-state-title">
            No activity recorded for this period.
          </p>
          <p className="activity-state-text">
            Try another date range or add feedback.
          </p>
        </div>
      ) : (
        <>
          <div className="chart-total-row">
            <strong>
              <AnimatedNumber value={metrics.total} />
            </strong>
            <span>feedback in the selected period</span>
          </div>

          <div className="area-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activity}
                margin={{ top: 12, right: 8, left: -18, bottom: 0 }}
                onClick={handlePointClick}
              >
                <defs>
                  <linearGradient
                    id="feedbackGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={CHART.line}
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART.line}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke={CHART.grid}
                  strokeDasharray="4 5"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: CHART.axis, fontSize: 12 }}
                  dy={10}
                  minTickGap={20}
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: CHART.axis, fontSize: 12 }}
                  width={42}
                />

                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: CHART.cursor }}
                />

                <Area
                  type="monotone"
                  dataKey="feedback"
                  name="Feedback"
                  stroke={CHART.line}
                  strokeWidth={2.5}
                  fill="url(#feedbackGradient)"
                  activeDot={{
                    r: 5,
                    fill: CHART.line,
                    stroke: CHART.dotRing,
                    strokeWidth: 2,
                    cursor: "pointer",
                  }}
                  animationDuration={650}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="activity-hint">
            <MousePointer2 size={13} />
            Select a chart point to inspect its feedback count.
          </div>
        </>
      )}
    </Card>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  color,
  loading,
  decimal = false,
}) {
  return (
    <div className="activity-metric">
      <div className="activity-metric-label">
        <Icon size={15} className={color} />
        <span>{label}</span>
      </div>

      <p className="activity-metric-value">
        {loading
          ? "..."
          : Number(value).toLocaleString("en-IN", {
              maximumFractionDigits: decimal ? 1 : 0,
            })}
      </p>
    </div>
  );
}