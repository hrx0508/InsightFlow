import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";

import {
  getFeedback,
  submitFeedback,
  importFeedbackCsv,
} from "../api/api";

import PageShell from "../components/ui/PageShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Skeleton from "../components/ui/Skeleton";
import StateMessage from "../components/ui/StateMessage";

import FeedbackTable from "../components/dashboard/FeedbackTable";
import FeedbackForm from "../components/dashboard/FeedbackForm";
import FeedbackImport from "../components/dashboard/FeedbackImport";
import FeedbackClassifier from "../components/dashboard/FeedbackClassifier";

import { downloadCsv } from "../utils/format";

const PAGE_SIZE = 10;

export default function FeedbackPage({ data, query = "" }) {
  const { feedback: dashboardFeedback, loading, error, reload } = data;

  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [feedback, setFeedback] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");

  const search = query.trim();

  const loadFeedback = useCallback(async () => {
    setFetching(true);
    setFetchError("");

    try {
      const result = await getFeedback({
        page,
        limit: PAGE_SIZE,
        search,
        category: category === "All" ? "" : category,
        sort,
      });

      if (!result.success) {
        throw new Error(result.message || "Unable to load feedback.");
      }

      setFeedback(result.feedback ?? []);
      setPagination(
        result.pagination ?? {
          page,
          limit: PAGE_SIZE,
          total: result.feedback?.length ?? 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      setFetchError(err.message || "Unable to load feedback.");
      setFeedback([]);
      setPagination({
        page,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setFetching(false);
    }
  }, [page, search, category, sort]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    setPage(1);
  }, [search, category, sort]);

  const categoryNames = useMemo(
    () => [
      ...new Set(
        (dashboardFeedback ?? [])
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ],
    [dashboardFeedback]
  );

  const handleSubmitFeedback = useCallback(
    async (formData) => {
      setSubmitting(true);
      setNotice("");

      try {
        const result = await submitFeedback(formData);

        if (!result.success) {
          throw new Error(result.message || "Failed to submit feedback.");
        }

        setNotice("Feedback submitted successfully!");
        setPage(1);

        await reload();
        await loadFeedback();
      } catch (err) {
        setNotice(err.message || "Failed to submit feedback.");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [reload, loadFeedback]
  );

  const handleImportFeedback = useCallback(
    async (file) => {
      setImporting(true);
      setNotice("");

      try {
        const result = await importFeedbackCsv(file);

        if (!result.success) {
          throw new Error(result.message || "Failed to import CSV.");
        }

        setCategory("All");
        setSort("newest");
        setPage(1);

        await reload();

        setNotice(
          `CSV imported successfully! ${result.imported ?? 0} records imported.`
        );

        return result;
      } catch (err) {
        setNotice(err.message || "Failed to import CSV.");
        throw err;
      } finally {
        setImporting(false);
      }
    },
    [reload]
  );

  const handleExport = async () => {
    try {
      const result = await getFeedback({
        page: 1,
        limit: 100,
        search,
        category: category === "All" ? "" : category,
        sort,
      });

      if (!result.success) {
        throw new Error(result.message || "Export failed.");
      }

      const total = result.pagination?.total ?? result.feedback.length;
      const allRecords = [...result.feedback];

      for (let currentPage = 2; allRecords.length < total; currentPage++) {
        const next = await getFeedback({
          page: currentPage,
          limit: 100,
          search,
          category: category === "All" ? "" : category,
          sort,
        });

        if (!next.success || !next.feedback?.length) break;

        allRecords.push(...next.feedback);
      }

      downloadCsv(allRecords, "feedback-filtered.csv");
    } catch (err) {
      setNotice(err.message || "Unable to export feedback.");
    }
  };

  const pages = pagination.totalPages || 1;
  const isLoading = loading || fetching;

  return (
    <PageShell
      title="Feedback"
      subtitle={`${pagination.total} matching records${
        search ? ` for "${search}"` : ""
      }`}
      actions={
        <div className="feedback-actions">
          <FeedbackImport
            onImport={handleImportFeedback}
            importing={importing}
          />

          <Button
            icon={Download}
            disabled={isLoading || pagination.total === 0}
            onClick={handleExport}
          >
            Export CSV
          </Button>

          <FeedbackForm
            onSubmit={handleSubmitFeedback}
            submitting={submitting}
          />
        </div>
      }
    >
      {notice && (
        <div className="feedback-notice" role="status">
          {notice}
        </div>
      )}

      {/* New: AI classification and correction interface */}
      <FeedbackClassifier />

      <Card className="feedback-panel">
        <div className="toolbar">
          <div className="chips">
            {["All", ...categoryNames].map((itemCategory) => (
              <button
                key={itemCategory}
                className={`chip ${
                  category === itemCategory ? "active" : ""
                }`}
                onClick={() => setCategory(itemCategory)}
              >
                {itemCategory}
              </button>
            ))}
          </div>

          <select
            className="select"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort feedback"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {isLoading ? (
          <div className="skeleton-rows">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} height={38} />
            ))}
          </div>
        ) : fetchError || error ? (
          <StateMessage
            type="error"
            title="Feedback unavailable"
            text={fetchError || error}
            onRetry={loadFeedback}
          />
        ) : feedback.length === 0 ? (
          <StateMessage
            title="No matching feedback"
            text="Try a different category or search term."
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${category}-${sort}-${page}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <FeedbackTable
                items={feedback}
                categoryNames={categoryNames}
              />
            </motion.div>
          </AnimatePresence>
        )}

        <div className="pagination">
          <span>
            Page {page} of {pages} · {pagination.total} records
          </span>

          <div>
            <Button
              variant="ghost"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((current) => current - 1)}
              icon={ChevronLeft}
            >
              Previous
            </Button>

            <Button
              variant="ghost"
              disabled={page >= pages || isLoading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}