import { useState } from "react";
import { Plus, X, MessageSquare } from "lucide-react";
import Button from "../ui/Button";
import Card from "../ui/Card";

const categories = [
  "Product Feedback",
  "Customer Service",
  "Operational Issues",
  "Fraud and Scam",
];

export default function FeedbackForm({ onSubmit, submitting }) {
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanedReview = review.trim();

    if (cleanedReview.length < 5) {
      setError("Please enter at least 5 characters.");
      return;
    }

    setError("");

    try {
      await onSubmit({
        review: cleanedReview,
        category,
      });

      setReview("");
      setCategory(categories[0]);
      setOpen(false);
    } catch (err) {
      setError(err.message || "Unable to submit feedback.");
    }
  }

  return (
    <>
      <Button
        icon={Plus}
        onClick={() => {
          setError("");
          setOpen((current) => !current);
        }}
      >
        {open ? "Cancel" : "Add Feedback"}
      </Button>

      {open && (
        <div className="feedback-form-overlay">
          <div
            className="feedback-form-backdrop"
            onClick={() => !submitting && setOpen(false)}
          />

          <Card className="feedback-form-card">
            <div className="feedback-form-heading">
              <div className="feedback-form-title">
                <div className="feedback-form-icon">
                  <MessageSquare size={20} />
                </div>

                <div>
                  <h3>Submit Customer Feedback</h3>
                  <p>
                    Add a new customer experience to InsightFlow.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="feedback-form-close"
                aria-label="Close feedback form"
                disabled={submitting}
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="feedback-form-field">
                <label htmlFor="feedback-review">
                  Customer feedback
                </label>

                <textarea
                  id="feedback-review"
                  value={review}
                  onChange={(event) => setReview(event.target.value)}
                  placeholder="Describe the customer's experience..."
                  rows={5}
                  maxLength={5000}
                  required
                  disabled={submitting}
                />

                <div className="feedback-character-count">
                  {review.length}/5000 characters
                </div>
              </div>

              <div className="feedback-form-field">
                <label htmlFor="feedback-category">
                  Category
                </label>

                <select
                  id="feedback-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  disabled={submitting}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="feedback-form-error" role="alert">
                  {error}
                </p>
              )}

              <div className="feedback-form-footer">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={submitting}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}