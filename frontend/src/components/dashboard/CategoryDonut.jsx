import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import Card, { CardHeader } from "../ui/Card";
import Skeleton from "../ui/Skeleton";
import StateMessage from "../ui/StateMessage";
import { getCategoryColor } from "../../utils/colors";
import { formatNumber } from "../../utils/format";

export default function CategoryDonut({ categories = [], loading }) {
  const [hover, setHover] = useState(null);

  const data = useMemo(
    () =>
      categories.map((category, index) => ({
        name: category.name,
        value: Number(category.percentage) || 0,
        count: Number(category.count) || 0,
        color: getCategoryColor(category.name, index),
      })),
    [categories]
  );

  const focus = hover !== null ? data[hover] : null;

  const totalFeedback = data.reduce(
    (sum, category) => sum + category.count,
    0
  );

  const leadingCategory = data.reduce(
    (largest, category) =>
      !largest || category.count > largest.count ? category : largest,
    null
  );

  return (
    <Card className="category-panel">
      <CardHeader
        title="Feedback categories"
        subtitle="Share of unique review/category pairs"
      />

      {loading ? (
        <div className="px-4 pb-4">
          <Skeleton
            height={180}
            radius={90}
            style={{
              maxWidth: 180,
              margin: "20px auto",
            }}
          />
          <Skeleton height={32} style={{ marginBottom: 8 }} />
          <Skeleton height={32} />
        </div>
      ) : data.length === 0 ? (
        <StateMessage
          title="No category data"
          text="Categories appear once the dataset is loaded."
        />
      ) : (
        <div className="px-4 pb-4">
          {/* Summary metrics */}
          <div className="mb-2 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
              <span className="text-xs text-gray-400">
                Total feedback
              </span>

              <p className="mt-1 text-lg font-semibold text-white">
                {formatNumber(totalFeedback)}
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
              <span className="text-xs text-gray-400">
                Top category
              </span>

              <p
                className="mt-1 truncate text-sm font-semibold text-white"
                title={leadingCategory?.name}
              >
                {leadingCategory?.name ?? "—"}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {formatNumber(leadingCategory?.count ?? 0)} records
              </p>
            </div>
          </div>

          {/* Donut chart */}
          <div className="donut-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={88}
                  paddingAngle={4}
                  stroke="none"
                  animationDuration={700}
                  onMouseEnter={(_, index) => setHover(index)}
                  onMouseLeave={() => setHover(null)}
                >
                  {data.map((category, index) => (
                    <Cell
                      key={category.name}
                      fill={category.color}
                      style={{
                        opacity:
                          hover === null || hover === index ? 1 : 0.3,
                        transition: "opacity 160ms ease",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Pie>

                <Tooltip content={() => null} />
              </PieChart>
            </ResponsiveContainer>

            <div className="donut-center" aria-live="polite">
              <strong>
                {focus ? `${focus.value}%` : "100%"}
              </strong>

              <span>
                {focus
                  ? `${formatNumber(focus.count)} reviews`
                  : "of feedback"}
              </span>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="category-legend">
            {[...data]
              .sort((a, b) => b.count - a.count)
              .map((category) => {
                const originalIndex = data.findIndex(
                  (item) => item.name === category.name
                );

                const isHovered = hover === originalIndex;

                return (
                  <button
                    key={category.name}
                    type="button"
                    className={`category-row w-full rounded-lg border border-transparent text-left transition-all duration-200 ${
                      isHovered
                        ? "border-white/[0.08] bg-white/[0.035]"
                        : "hover:bg-white/[0.02]"
                    }`}
                    onMouseEnter={() => setHover(originalIndex)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(originalIndex)}
                    onBlur={() => setHover(null)}
                    aria-label={`${category.name}: ${category.value}% of feedback, ${formatNumber(category.count)} records`}
                  >
                    <span className="category-name min-w-0">
                      <span
                        className="legend-dot shrink-0"
                        style={{ background: category.color }}
                      />

                      <span className="truncate">
                        {category.name}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {formatNumber(category.count)}
                      </span>

                      <strong className="min-w-10 text-right">
                        {category.value}%
                      </strong>
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </Card>
  );
}