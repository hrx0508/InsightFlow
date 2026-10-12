import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Search,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import { getCategoryColor } from "../../utils/colors";

function Row({ item, index, categoryIndex }) {
  const [open, setOpen] = useState(false);

  const color = getCategoryColor(item.category, categoryIndex);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: Math.min(index * 0.025, 0.2),
        duration: 0.3,
      }}
      className={`row ${open ? "open" : ""}`}
      onClick={() => setOpen((previous) => !previous)}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setOpen((previous) => !previous);
        }
      }}
    >
      <td className="id-cell">#{item.id}</td>

      <td>
        <div className={`message-cell ${open ? "expanded" : ""}`}>
          {item.review || "No review text available"}
        </div>
      </td>

      <td>
        <span className="category-badge">
          <span
            className="legend-dot"
            style={{ background: color }}
          />
          {item.category || "Uncategorized"}
        </span>
      </td>

      <td className="chevron-cell">
        <ChevronDown
          size={15}
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 200ms",
          }}
        />
      </td>
    </motion.tr>
  );
}

export default function FeedbackTable({
  items = [],
  categoryNames = [],
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = items.filter((item) => {
      const matchesSearch =
        !query ||
        String(item.id ?? "").toLowerCase().includes(query) ||
        String(item.review ?? "").toLowerCase().includes(query) ||
        String(item.category ?? "").toLowerCase().includes(query);

      const matchesCategory =
        category === "all" || item.category === category;

      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      if (sortBy === "oldest") {
        return Number(a.id) - Number(b.id);
      }

      if (sortBy === "alphabetical") {
        return String(a.review ?? "").localeCompare(
          String(b.review ?? "")
        );
      }

      return Number(b.id) - Number(a.id);
    });

    return result;
  }, [items, search, category, sortBy]);

  const hasFilters = search !== "" || category !== "all";

  function resetFilters() {
    setSearch("");
    setCategory("all");
    setSortBy("newest");
  }

  return (
    <div className="feedback-explorer">
      {/* Explorer controls */}
      <div className="explorer-controls">
        <div className="explorer-search">
          <Search size={16} className="explorer-icon" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search feedback, category, or record ID..."
            aria-label="Search feedback"
          />
        </div>

        <div className="explorer-selects">
          <div className="explorer-select">
            <SlidersHorizontal size={14} className="explorer-icon" />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>

              {categoryNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="explorer-select">
            <ArrowUpDown size={14} className="explorer-icon" />

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort feedback"
            >
              <option value="newest">Highest ID</option>
              <option value="oldest">Lowest ID</option>
              <option value="alphabetical">A–Z feedback</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results summary */}
      <div className="explorer-summary">
        <p className="explorer-count" aria-live="polite">
          Showing{" "}
          <span className="explorer-count-num">
            {filteredItems.length}
          </span>{" "}
          of{" "}
          <span className="explorer-count-num">
            {items.length}
          </span>{" "}
          loaded records
        </p>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="explorer-reset"
          >
            <RotateCcw size={13} />
            Reset filters
          </button>
        )}
      </div>

      {/* Feedback table */}
      <div className="feedback-table-wrap">
        <table className="feedback-table">
          <thead>
            <tr>
              <th>Record</th>
              <th>Feedback</th>
              <th>Category</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {filteredItems.map((item, index) => (
              <Row
                key={item.id}
                item={item}
                index={index}
                categoryIndex={Math.max(
                  0,
                  categoryNames.indexOf(item.category)
                )}
              />
            ))}

            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="explorer-empty">
                    <Search size={22} className="explorer-empty-icon" />

                    <p className="explorer-empty-title">
                      No matching feedback
                    </p>

                    <p className="explorer-empty-text">
                      Try another search term or change your filters.
                    </p>

                    {hasFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="explorer-reset"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}