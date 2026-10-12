import { Sparkles, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "../../lib/motion";
import Button from "../ui/Button";

export default function InsightBanner({ onExplore, headline }) {
  return (
    <motion.div variants={fadeUp} className="insight-card">
      <div className="insight-symbol"><Sparkles size={20} /></div>
      <div className="insight-copy">
        <h3>{headline}</h3>
        <p>Find recurring complaints, understand what customers need, and spot where to improve.</p>
      </div>
      <Button variant="accent" onClick={onExplore}>View insights <ArrowUpRight size={16} /></Button>
    </motion.div>
  );
}
