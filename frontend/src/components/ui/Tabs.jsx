import { motion } from "framer-motion";
import { useId } from "react";

// Segmented control with a sliding highlight.
export default function Tabs({ options, value, onChange }) {
  const id = useId();
  return (
    <div className="tabs" role="tablist">
      {options.map((opt) => (
        <button key={opt} role="tab" aria-selected={value === opt}
          className={`tab ${value === opt ? "active" : ""}`} onClick={() => onChange(opt)}>
          {value === opt && <motion.span layoutId={id} className="tab-pill" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
          <span>{opt}</span>
        </button>
      ))}
    </div>
  );
}
