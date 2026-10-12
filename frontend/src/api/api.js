const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));

    throw new Error(
      result.message || `API request failed: ${response.status}`
    );
  }

  return response.json();
}

export function getOverview() {
  return fetchAPI("/overview");
}

export function getFeedback({
  page = 1,
  limit = 10,
  search = "",
  category = "",
  sort = "newest",
  includeDuplicates = false,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search,
    category,
    sort,
    includeDuplicates: String(includeDuplicates),
  });

  return fetchAPI(`/feedback?${params.toString()}`);
}

export function submitFeedback(feedback) {
  return fetchAPI("/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(feedback),
  });
}


export async function getFeedbackActivity(range = "7D") {
  const response = await fetch(
    `${API_BASE_URL}/feedback/activity?range=${range}`
  );

  if (!response.ok) {
    throw new Error("Unable to load feedback activity.");
  }

  return response.json();
}

export function importFeedbackCsv(file) {
  const formData = new FormData();
  formData.append("file", file);

  return fetchAPI("/feedback/import", {
    method: "POST",
    body: formData,
  });
}


export async function getAnalysis() {
  const response = await fetch(`${API_BASE_URL}/analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(
      `Analysis failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}


export async function predictFeedback(review) {
  const response = await fetch(`${API_BASE_URL}/ai/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ review }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Prediction failed");
  }

  return data.prediction;
}

export async function submitCorrection({
  review,
  predictedCategory,
  correctedCategory,
  confidence,
  modelVersion,
}) {
  const response = await fetch(`${API_BASE_URL}/ai/corrections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      review,
      predicted_category: predictedCategory,
      corrected_category: correctedCategory,
      confidence,
      model_version: modelVersion,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not save correction");
  }

  return data;
}