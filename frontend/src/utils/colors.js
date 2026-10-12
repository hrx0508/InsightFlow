const palette = ["#818cf8", "#34d399", "#fbbf24", "#fb7185", "#38bdf8", "#c084fc", "#f472b6"];

// Known labels keep a fixed colour; anything new falls back to the palette by index.
const known = {
  "Product Feedback": "#818cf8",
  "Customer Service": "#34d399",
  "Operational Issues": "#fbbf24",
  "Fraud and Scam": "#fb7185",
  "Fraud & Scam": "#fb7185",
};

export const getCategoryColor = (name, index = 0) =>
  known[name] || palette[index % palette.length];
