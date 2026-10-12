import { useState } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import Overview from "./pages/Overview";
import FeedbackPage from "./pages/FeedbackPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import InsightsPage from "./pages/InsightsPage";
import SettingsPage from "./pages/SettingsPage";
import { useDashboardData } from "./hooks/useDashboardData";
import "./styles/app.css";

const pages = {
  overview: Overview,
  feedback: FeedbackPage,
  analytics: AnalyticsPage,
  insights: InsightsPage,
  settings: SettingsPage,
};

export default function App() {
  const [page, setPage] = useState("overview");
  const [query, setQuery] = useState("");
  const data = useDashboardData();
  const Page = pages[page];

  // Typing in the search box jumps to the feedback list.
  const handleQuery = (value) => {
    setQuery(value);
    if (value && page !== "feedback") setPage("feedback");
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-layout">
        <Sidebar active={page} onNavigate={setPage} feedbackCount={data.overview?.totals?.uniqueReviews ?? 0} />
        <main className="main-content">
          <Topbar page={page} query={query} onQueryChange={handleQuery} />
          <AnimatePresence mode="wait">
            <Page key={page} data={data} query={query} onNavigate={setPage} />
          </AnimatePresence>
        </main>
      </div>
    </MotionConfig>
  );
}
