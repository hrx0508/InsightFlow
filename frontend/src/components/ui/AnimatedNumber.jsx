import { useCountUp } from "../../hooks/useCountUp";
import { formatNumber } from "../../utils/format";

export default function AnimatedNumber({ value, decimals = 0, suffix = "" }) {
  const v = useCountUp(value);
  return <>{formatNumber(v, decimals)}{suffix}</>;
}
