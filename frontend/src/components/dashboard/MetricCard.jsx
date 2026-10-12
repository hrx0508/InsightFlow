import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { fadeUp } from "../../lib/motion";
import AnimatedNumber from "../ui/AnimatedNumber";
import Skeleton from "../ui/Skeleton";

export default function MetricCard({ title, value, decimals = 0, suffix = "", change, positive = true, icon: Icon, tone, note, loading }) {
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -3 }} className="metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <div className={`metric-icon ${tone}`}><Icon size={19} /></div>
      </div>
      <div className="metric-value">
        {loading ? <Skeleton width={110} height={30} /> : <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />}
      </div>
      <div className="metric-bottom">
        <span className={`metric-change ${positive ? "up" : "down"}`}>
          {positive ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
          {loading ? "..." : change}
        </span>
        <span className="metric-note">{note}</span>
      </div>
    </motion.div>
  );
}
