import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import Button from "../ui/Button";

export default function FeedbackImport({ onImport, importing }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    try {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error("Please select a CSV file.");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("The CSV file must be smaller than 5 MB.");
      }

      const result = await onImport(file);

      setSuccess(
        result?.message ||
        `CSV imported successfully. ${result?.imported ?? ""} records added.`
      );
    } catch (err) {
      setError(err.message || "Unable to import CSV.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={handleFileChange}
      />

      <Button
        icon={Upload}
        variant="ghost"
        disabled={importing}
        onClick={() => inputRef.current?.click()}
      >
        {importing ? "Importing..." : "Import CSV"}
      </Button>

      {error && (
        <p role="alert" className="feedback-form-error">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="feedback-import-success">
          {success}
        </p>
      )}
    </div>
  );
}