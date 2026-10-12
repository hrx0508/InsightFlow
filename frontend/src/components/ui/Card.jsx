import { motion } from "framer-motion";
import { fadeUp } from "../../lib/motion";

export default function Card({ children, className = "", ...rest }) {
  return (
    <motion.section variants={fadeUp} className={`panel ${className}`} {...rest}>
      {children}
    </motion.section>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="panel-heading">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
