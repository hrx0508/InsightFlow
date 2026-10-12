import { useState } from "react";
import {
  Activity,
  BrainCircuit,
  RefreshCw,
  Play,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Tags,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Lightbulb,
  Zap,
} from "lucide-react";

import { getAnalysis } from "../../api/api";

export default function AnalysisPanel() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);

  async function runAnalysis() {
    try {
      setLoading(true);
      setError("");

      const result = await getAnalysis();
      setAnalysis(result?.analysis ?? result?.data ?? result);
      setExpanded(true);
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message || "Unable to analyze feedback.");
    } finally {
      setLoading(false);
    }
  }

  const sentiment = analysis
    ? normalizeSentiment(
        analysis.sentimentDistribution ??
          analysis.sentiment_distribution ??
          analysis.sentiment
      )
    : [];

  const recommendations = Array.isArray(analysis?.recommendations)
    ? analysis.recommendations
    : [];

  const topicSource =
    analysis?.topicCounts ??
    analysis?.topic_counts ??
    analysis?.topics;

  // Fallback: derive recurring topics from recommendation evidence.
  const topics = normalizeTopics(topicSource, recommendations);

  const totalSentiment = sentiment.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const negativeSentiment = sentiment.find(
    (item) => item.name.toLowerCase() === "negative"
  )?.count ?? 0;

  const negativeCount = Number(
    analysis?.negativeCount ??
      analysis?.negative_count ??
      analysis?.totalNegative ??
      analysis?.total_negative ??
      negativeSentiment
  );

  const rawPercentage =
    analysis?.negativePercentage ??
    analysis?.negative_percentage ??
    analysis?.negativePercent ??
    analysis?.negative_percent;

  const negativePercentage =
    rawPercentage != null && Number.isFinite(Number(rawPercentage))
      ? Number(rawPercentage)
      : totalSentiment > 0
        ? (negativeSentiment / totalSentiment) * 100
        : 0;

  return (
    <section className="intel-panel">
      {/* Header */}
      <div className="intel-header">
        <div className="intel-title-wrap">
          <div className="intel-icon">
            <BrainCircuit size={21} />
          </div>

          <div className="intel-title-text">
            <div className="intel-title-row">
              <h2>Feedback Intelligence</h2>

              <span className="intel-badge">Python Engine</span>
            </div>

            <p className="intel-subtitle">
              {analysis
                ? "Analysis results are ready."
                : "Discover sentiment, recurring issues and recommended actions."}
            </p>
          </div>
        </div>

        <div className="intel-header-actions">
          {analysis && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse analysis" : "Expand analysis"}
              className="intel-icon-btn"
            >
              {expanded ? (
                <ChevronUp size={17} />
              ) : (
                <ChevronDown size={17} />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className="intel-run-btn"
          >
            {loading ? (
              <RefreshCw size={15} className="intel-spin" />
            ) : analysis ? (
              <RefreshCw size={15} />
            ) : (
              <Play size={15} fill="currentColor" />
            )}

            {loading
              ? "Analyzing..."
              : analysis
                ? "Re-analyze"
                : "Run Analysis"}
          </button>
        </div>
      </div>

      {/* Initial state: no automatic API call */}
      {!analysis && !loading && !error && (
        <div className="intel-intro">
          <div>
            <div className="intel-intro-title">
              <Zap size={15} />
              Ready to uncover customer patterns?
            </div>

            <p className="intel-intro-text">
              Run the analysis when you're ready. The Python engine will
              evaluate sentiment, identify recurring topics and generate
              actionable recommendations.
            </p>
          </div>

          <div className="intel-chips">
            <span className="intel-chip">Sentiment</span>
            <span className="intel-chip">Topics</span>
            <span className="intel-chip">Actions</span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="intel-loading">
          <Activity size={19} className="intel-pulse" />

          <div>
            <p className="intel-loading-title">
              Analyzing customer feedback
            </p>
            <p className="intel-loading-text">
              Processing sentiment, topics and recommendations...
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="intel-error">
          <AlertCircle size={18} className="intel-error-icon" />

          <div>
            <p className="intel-error-title">
              Analysis couldn't be completed
            </p>
            <p className="intel-error-text">{error}</p>

            <button
              type="button"
              onClick={runAnalysis}
              className="intel-link-btn"
            >
              Try again →
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {analysis && expanded && !loading && (
        <div className="intel-results">
          {/* Metrics */}
          <div className="intel-metrics">
            <Metric
              icon={TrendingDown}
              label="Negative Feedback"
              value={formatNumber(negativeCount)}
              detail={`${formatNumber(negativePercentage)}% of analyzed feedback`}
              color="red"
            />

            <Metric
              icon={Activity}
              label="Sentiment Analyzed"
              value={formatNumber(totalSentiment)}
              detail={`${sentiment.length} sentiment groups`}
              color="teal"
            />

            <Metric
              icon={Tags}
              label="Recurring Topics"
              value={formatNumber(topics.length)}
              detail={`${recommendations.length} recommendations generated`}
              color="amber"
            />
          </div>

          {/* Sentiment */}
          <div className="intel-box">
            <div className="intel-box-head">
              <div>
                <h3 className="intel-box-title">Sentiment Breakdown</h3>
                <p className="intel-muted">
                  Distribution across analyzed feedback
                </p>
              </div>

              <span className="intel-faint">
                {formatNumber(totalSentiment)} reviews
              </span>
            </div>

            {sentiment.length > 0 ? (
              <>
                <div className="intel-stackbar">
                  {sentiment.map((item) => (
                    <div
                      key={item.name}
                      title={`${item.name}: ${formatNumber(item.count)}`}
                      style={{
                        width: `${
                          totalSentiment
                            ? (item.count / totalSentiment) * 100
                            : 0
                        }%`,
                      }}
                      className={`intel-seg ${sentimentColor(item.name)}`}
                    />
                  ))}
                </div>

                <div className="intel-sent-grid">
                  {sentiment.map((item) => {
                    const percentage = totalSentiment
                      ? (item.count / totalSentiment) * 100
                      : 0;

                    return (
                      <div key={item.name} className="intel-sent-item">
                        <div className="intel-sent-label">
                          <span
                            className={`intel-dot ${sentimentColor(item.name)}`}
                          />

                          <span>{item.name}</span>
                        </div>

                        <p className="intel-sent-value">
                          {formatNumber(item.count)}
                        </p>

                        <p className="intel-faint">
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <Empty message="Sentiment distribution is unavailable." />
            )}
          </div>

          {/* Topics */}
          <div className="intel-box">
            <div className="intel-box-head intel-box-head-start">
              <Tags size={16} className="intel-amber" />
              <h3 className="intel-box-title">Recurring Customer Issues</h3>
            </div>

            {topics.length > 0 ? (
              <div className="intel-topic-list">
                {topics.slice(0, 6).map((topic) => {
                  const maxCount = Math.max(
                    ...topics.map((item) => item.count),
                    1
                  );

                  return (
                    <div key={topic.name}>
                      <div className="intel-topic-head">
                        <span className="intel-topic-name">
                          {formatLabel(topic.name)}
                        </span>

                        <span className="intel-topic-count">
                          {formatNumber(topic.count)}
                        </span>
                      </div>

                      <div className="intel-track">
                        <div
                          className="intel-fill"
                          style={{
                            width: `${(topic.count / maxCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty message="No topic counts were returned by the analysis engine." />
            )}
          </div>

          {/* Recommendations */}
          <div>
            <div className="intel-rec-head">
              <Lightbulb size={17} />

              <h3 className="intel-box-title">Recommended Actions</h3>

              <span className="intel-pill">{recommendations.length}</span>
            </div>

            {recommendations.length > 0 ? (
              <div className="intel-rec-grid">
                {recommendations.map((item, index) => {
                  const recommendation =
                    typeof item === "string" ? { title: item } : item ?? {};

                  const title =
                    recommendation.title ??
                    recommendation.message ??
                    recommendation.recommendation ??
                    `Recommendation ${index + 1}`;

                  const priority = recommendation.priority ?? "Normal";

                  return (
                    <article
                      key={`${title}-${index}`}
                      className="intel-rec"
                    >
                      <div className="intel-rec-top">
                        <div className="intel-rec-left">
                          <div className="intel-rec-icon">
                            <ShieldAlert size={16} />
                          </div>

                          <h4 className="intel-rec-title">{title}</h4>
                        </div>

                        <span
                          className={`intel-priority ${
                            String(priority).toLowerCase() === "high"
                              ? "intel-priority-high"
                              : String(priority).toLowerCase() === "medium"
                                ? "intel-priority-medium"
                                : "intel-priority-low"
                          }`}
                        >
                          {priority}
                        </span>
                      </div>

                      {recommendation.reason && (
                        <p className="intel-rec-reason">
                          {recommendation.reason}
                        </p>
                      )}

                      {recommendation.action && (
                        <div className="intel-rec-action">
                          <p className="intel-rec-action-label">
                            Suggested action
                          </p>

                          <p className="intel-rec-action-text">
                            {recommendation.action}
                          </p>
                        </div>
                      )}

                      {recommendation.evidenceCount != null && (
                        <div className="intel-rec-evidence">
                          <CheckCircle2 size={13} />
                          {formatNumber(recommendation.evidenceCount)}{" "}
                          supporting entries
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <Empty message="No recommendations are available." />
            )}
          </div>
        </div>
      )}

      {/* Compact collapsed state */}
      {analysis && !expanded && !loading && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="intel-collapsed"
        >
          <span className="intel-collapsed-text">
            {formatNumber(negativeCount)} negative reviews ·{" "}
            {topics.length} recurring topics ·{" "}
            {recommendations.length} recommendations
          </span>

          <span className="intel-collapsed-cta">
            View results <ChevronDown size={14} />
          </span>
        </button>
      )}
    </section>
  );
}

function Metric({ icon: Icon, label, value, detail, color }) {
  return (
    <div className="intel-box intel-metric">
      <div className="intel-metric-head">
        <div className={`intel-metric-icon intel-tone-${color}`}>
          <Icon size={16} />
        </div>

        <span className="intel-muted">{label}</span>
      </div>

      <p className="intel-metric-value">{value}</p>

      <p className="intel-faint">{detail}</p>
    </div>
  );
}

function normalizeSentiment(source) {
  if (!source) return [];

  const entries = Array.isArray(source)
    ? source.map((item) => [
        item.sentiment ?? item.label ?? item.name ?? "Unknown",
        item.count ?? item.value ?? 0,
      ])
    : Object.entries(source).map(([name, value]) => [
        name,
        typeof value === "object"
          ? value.count ?? value.value ?? 0
          : value,
      ]);

  return entries.map(([name, count]) => ({
    name: formatLabel(name),
    count: Math.max(0, Number(count) || 0),
  }));
}

function normalizeTopics(source, recommendations) {
  if (Array.isArray(source)) {
    return source
      .map((item) => ({
        name: item.topic ?? item.name ?? item.label ?? "Other",
        count: Math.max(0, Number(item.count ?? item.value ?? 0) || 0),
      }))
      .sort((a, b) => b.count - a.count);
  }

  if (source && typeof source === "object") {
    return Object.entries(source)
      .map(([name, value]) => ({
        name,
        count: Math.max(
          0,
          Number(
            typeof value === "object"
              ? value.count ?? value.value ?? 0
              : value
          ) || 0
        ),
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Recommendations provide evidence for their associated topics.
  const derived = new Map();

  recommendations.forEach((item) => {
    if (!item || typeof item !== "object") return;

    const title = item.title ?? item.topic;

    if (!title) return;

    const name = String(title).replace(
      /^(investigate|review|improve|address|monitor)\s+/i,
      ""
    );

    const count = Number(item.evidenceCount ?? item.evidence_count ?? 0);

    if (count > 0) {
      derived.set(name, Math.max(derived.get(name) ?? 0, count));
    }
  });

  return [...derived.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function sentimentColor(name) {
  const value = name.toLowerCase();

  if (value.includes("negative")) return "intel-bg-negative";
  if (value.includes("positive")) return "intel-bg-positive";

  return "intel-bg-neutral";
}

function formatNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString("en-IN", { maximumFractionDigits: 1 })
    : "0";
}

function formatLabel(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Empty({ message }) {
  return <p className="intel-empty">{message}</p>;
}