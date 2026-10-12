import { motion } from "framer-motion";
import { Activity, ChevronDown, Settings, MoreHorizontal } from "lucide-react";
import { navItems } from "../../data/navigation";
import { formatNumber } from "../../utils/format";

export default function Sidebar({ active, onNavigate, feedbackCount }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon"><Activity size={21} /></div>
        <div>
          <h1>InsightFlow</h1>
          <span>Feedback intelligence</span>
        </div>
      </div>

      <div className="workspace">
        <div className="workspace-avatar">IF</div>
        <div className="workspace-info"><strong>My Workspace</strong><span>Free plan</span></div>
        <ChevronDown size={16} />
      </div>

      <div className="nav-label">Workspace</div>
      <nav className="navigation">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`nav-item ${active === id ? "active" : ""}`} onClick={() => onNavigate(id)}>
            {active === id && <motion.span layoutId="nav-active" className="nav-highlight" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <Icon size={18} />
            <span>{label}</span>
            {id === "feedback" && feedbackCount > 0 && <span className="nav-count">{formatNumber(feedbackCount)}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className={`nav-item ${active === "settings" ? "active" : ""}`} onClick={() => onNavigate("settings")}>
          {active === "settings" && <motion.span layoutId="nav-active" className="nav-highlight" />}
          <Settings size={18} /><span>Settings</span>
        </button>
        <div className="profile">
          <div className="profile-avatar">H</div>
          <div className="profile-info"><strong>Workspace Admin</strong><span>admin@example.com</span></div>
          <MoreHorizontal size={18} />
        </div>
      </div>
    </aside>
  );
}
