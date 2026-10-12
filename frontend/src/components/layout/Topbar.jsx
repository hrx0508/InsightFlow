import { useEffect, useRef } from "react";
import { Search, Bell } from "lucide-react";
import { navItems } from "../../data/navigation";

export default function Topbar({ page, query, onQueryChange }) {
  const ref = useRef(null);
  const title = navItems.find((n) => n.id === page)?.label ?? "Settings";

  // Ctrl/Cmd + K focuses search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); ref.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="topbar">
      <div className="breadcrumb">Workspace <span>/</span> <strong>{title}</strong></div>
      <div className="topbar-actions">
        <label className="search-box">
          <Search size={17} />
          <input ref={ref} value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Search feedback..." />
          <kbd>Ctrl K</kbd>
        </label>
        <button className="notification-button" aria-label="Notifications"><Bell size={19} /><span /></button>
        <div className="topbar-avatar">H</div>
      </div>
    </header>
  );
}
