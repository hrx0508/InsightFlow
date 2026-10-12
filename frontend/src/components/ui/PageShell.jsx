import { motion } from "framer-motion";
import { stagger, pageExit } from "../../lib/motion";

export default function PageShell({ title, subtitle, actions, children }) {
  return (
    <motion.div className="dashboard" variants={stagger} initial="hidden" animate="show" exit={pageExit}>
      <div className="welcome-section">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </motion.div>
  );
}
