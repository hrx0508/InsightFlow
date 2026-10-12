import { AlertTriangle, Inbox } from "lucide-react";
import Button from "./Button";

export default function StateMessage({ type = "empty", title, text, onRetry }) {
  const Icon = type === "error" ? AlertTriangle : Inbox;
  return (
    <div className={`state-message ${type}`}>
      <Icon size={22} />
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </div>
  );
}
