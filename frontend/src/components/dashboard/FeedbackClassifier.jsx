import { useState } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";

import { predictFeedback, submitCorrection } from "../../api/api";
import Button from "../ui/Button";
import Card from "../ui/Card";

const CATEGORIES = [
  "Product Feedback",
  "Customer Service",
  "Operational Issues",
  "Fraud and Scam",
];

export default function FeedbackClassifier() {
  const [review, setReview] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [correctedCategory, setCorrectedCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handlePredict(event) {
    event.preventDefault();

    if (!review.trim()) {
      setError("Enter a customer review first.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    setPrediction(null);
    setCorrectedCategory("");

    try {
      const result = await predictFeedback(review.trim());

      setPrediction(result);
      setCorrectedCategory(result.predicted_category);
    } catch (err) {
      setError(err.message || "Unable to classify this review.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCorrection(event) {
    event.preventDefault();

    if (!prediction) return;

    if (correctedCategory === prediction.predicted_category) {
      setError("Choose a different category to submit a correction.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await submitCorrection({
        review: prediction.review || review.trim(),
        predictedCategory: prediction.predicted_category,
        correctedCategory,
        confidence: prediction.confidence,
        modelVersion: prediction.model_version || "baseline-v1",
      });

      setNotice(
        "Correction saved successfully. It can be used for retraining after verification."
      );
    } catch (err) {
      setError(err.message || "Unable to save this correction.");
    } finally {
      setSaving(false);
    }
  }

  function resetClassifier() {
    setReview("");
    setPrediction(null);
    setCorrectedCategory("");
    setError("");
    setNotice("");
  }

  const confidence = prediction
    ? Math.round(Number(prediction.confidence) * 100)
    : 0;

  return (
    <Card className="ai-classifier">
      <div className="ai-classifier-header">
        <div className="ai-classifier-icon">
          <BrainCircuit size={23} />
        </div>

        <div className="ai-classifier-heading">
          <div className="ai-classifier-title-row">
            <h3>AI Feedback Classifier</h3>
            <span className="ai-classifier-badge">
              <Sparkles size={12} />
              ML Powered
            </span>
          </div>

          <p>
            Classify customer feedback, review predictions, and correct
            inaccurate categories.
          </p>
        </div>
      </div>

      <form onSubmit={handlePredict} className="ai-classifier-form">
        <label htmlFor="ai-review-input">Customer review</label>

        <textarea
          id="ai-review-input"
          value={review}
          onChange={(event) => setReview(event.target.value)}
          placeholder="Example: The app crashes whenever I try to make a payment..."
          rows={4}
          maxLength={5000}
          disabled={loading}
        />

        <div className="ai-classifier-form-footer">
          <span>{review.length}/5000 characters</span>

          <Button
            type="submit"
            icon={loading ? LoaderCircle : BrainCircuit}
            disabled={loading || !review.trim()}
          >
            {loading ? "Analyzing..." : "Classify Review"}
          </Button>
        </div>
      </form>

      {error && (
        <div className="ai-classifier-message error" role="alert">
          <AlertTriangle size={17} />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="ai-classifier-message success" role="status">
          <CheckCircle2 size={17} />
          <span>{notice}</span>
        </div>
      )}

      {prediction && (
        <motion.div
          className="ai-prediction-result"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="ai-result-top">
            <div>
              <span className="ai-result-label">Predicted category</span>

              <h4>{prediction.predicted_category}</h4>
            </div>

            <div className="ai-confidence">
              <strong>{confidence}%</strong>
              <span>Confidence</span>
            </div>
          </div>

          <div
            className="ai-confidence-track"
            role="progressbar"
            aria-label="Prediction confidence"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={confidence}
          >
            <div
              className="ai-confidence-fill"
              style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
            />
          </div>

          {prediction.needs_human_review && (
            <div className="ai-review-warning">
              <AlertTriangle size={17} />
              <span>
                Low confidence. A human should review this prediction before
                relying on it.
              </span>
            </div>
          )}

          <form onSubmit={handleCorrection} className="ai-correction-form">
            <div className="ai-correction-heading">
              <div>
                <h4>Is this prediction correct?</h4>
                <p>
                  If not, select the correct category to record your feedback.
                </p>
              </div>
            </div>

            <label htmlFor="ai-correct-category">Correct category</label>

            <select
              id="ai-correct-category"
              className="select ai-category-select"
              value={correctedCategory}
              onChange={(event) => {
                setCorrectedCategory(event.target.value);
                setNotice("");
                setError("");
              }}
              disabled={saving || Boolean(notice)}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <div className="ai-correction-actions">
              <Button
                type="button"
                variant="ghost"
                icon={RotateCcw}
                onClick={resetClassifier}
                disabled={saving}
              >
                Start over
              </Button>

              <Button
                type="submit"
                disabled={
                  saving ||
                  Boolean(notice) ||
                  correctedCategory === prediction.predicted_category
                }
              >
                {saving ? "Saving..." : "Submit Correction"}
              </Button>
            </div>
          </form>

          <p className="ai-model-note">
            Model: {prediction.model_version || "baseline-v1"}
          </p>
        </motion.div>
      )}
    </Card>
  );
}