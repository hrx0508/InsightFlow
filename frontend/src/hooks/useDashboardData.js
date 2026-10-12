import { useCallback, useEffect, useState } from "react";
import { getOverview, getFeedback } from "../api/api";

export function useDashboardData() {
  const [overview, setOverview] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewData, feedbackData] = await Promise.all([
        getOverview(),
        getFeedback({ page: "1", limit: "100" }),
      ]);

      if (!overviewData.success || !feedbackData.success) {
        throw new Error("The API returned an unsuccessful response.");
      }

      setOverview(overviewData);
      setFeedback(feedbackData.feedback);
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    overview,
    feedback,
    loading,
    error,
    reload: load,
  };
}