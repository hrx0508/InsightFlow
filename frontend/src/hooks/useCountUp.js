import { useEffect, useState } from "react";
import { animate } from "framer-motion";

export function useCountUp(value, duration = 1) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const controls = animate(0, Number(value) || 0, { duration, ease: "easeOut", onUpdate: setCurrent });
    return () => controls.stop();
  }, [value, duration]);
  return current;
}
