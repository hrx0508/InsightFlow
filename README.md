# InsightFlow
### Intelligent Customer Feedback & Decision Platform

**Transform customer feedback into actionable business insights using machine learning and human-reviewed classification.**

InsightFlow is a full-stack analytics platform that helps businesses organize customer feedback, identify recurring issues, classify reviews, and explore patterns that can support better decisions.

Built with React, Node.js, Express, SQLite, and Python-based machine learning, InsightFlow combines an interactive dashboard with a feedback classification workflow and a human-in-the-loop correction mechanism.

<p align="center">
  <a href="https://insight-flow-drab-one.vercel.app/">
    <strong>Live Application</strong>
  </a>
  &nbsp; • &nbsp;
  <a href="https://insightflow-7j39.onrender.com/api/health">
    <strong>API Health Check</strong>
  </a>
</p>

---

## Visual Preview

| [`images/image-0.png`] -- | Overview |
| [`images/image-1.png`] -- | FeedBack Intelligence System |
| [`images/image-2.png`] -- | Recent Feedback with filtering, sorting |
| [`images/image-3.png`] -- | AI Feedback Classifier |
| [`images/image-4.png`] -- | Analytics |
| [`images/image-5.png`] -- | AI Insights |


## Table of Contents

- [Visual Preview](#visual-preview)
- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Machine Learning Pipeline](#machine-learning-pipeline)
- [Adaption Labs Exploration](#adaption-labs-exploration)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Feedback Categories](#feedback-categories)
- [Dataset and Evaluation](#dataset-and-evaluation)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Example: Predicting a Feedback Category](#example-predicting-a-feedback-category)
- [Deployment](#deployment)
- [Security and Privacy](#security-and-privacy)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
- [License](#license)

---

## Overview

Businesses receive feedback through reviews, surveys, support conversations, and other channels. Turning this unstructured information into useful insights requires more than simply collecting comments.

InsightFlow provides a centralized interface for exploring feedback and using machine learning to suggest meaningful categories.

The application combines:

- An interactive feedback analytics dashboard.
- Feedback browsing, filtering, and submission.
- CSV-based feedback import.
- Machine-learning-powered text classification.
- Prediction confidence and human review.
- A correction workflow for identifying classification errors.
- Python scripts supporting model training and evaluation.

### Intended Users

InsightFlow is designed as a prototype for:

- Customer experience teams.
- Product managers.
- Support and operations teams.
- Business analysts.
- Developers exploring practical machine-learning applications.

The goal is to help users organize feedback more efficiently and identify information that deserves further investigation.

## Problem Statement

Customer feedback contains valuable information about product quality, customer service, operational failures, and potentially fraudulent activity.

However, manually reviewing and categorizing large collections of feedback can be time-consuming. Important issues may be difficult to identify when comments are scattered across a dataset.

Common challenges include:

- Organizing large numbers of customer reviews.
- Finding feedback associated with recurring problems.
- Identifying the appropriate category for each review.
- Monitoring patterns in feedback over time.
- Reviewing incorrect automated classifications.
- Turning raw feedback into information that supports decisions.

InsightFlow explores how an integrated analytics dashboard and machine-learning classification workflow can help address these challenges.

## Our Solution

InsightFlow combines a web-based feedback management interface with a Python machine-learning classifier.

Users can browse existing feedback, search and filter records, import CSV data, and submit new feedback. The classifier can suggest a category for a review and provide a confidence score to help users decide when additional review may be appropriate.

When a prediction is incorrect, a user can submit a corrected category. These corrections can support a controlled model-improvement workflow involving verification, retraining, evaluation, and a deliberate decision about whether to replace the existing model.

**An important design principle is that user corrections do not automatically change the live model.** Corrections must pass through the appropriate data preparation and model evaluation steps before a candidate model should be considered for deployment.

---

## Key Features

### 1. Interactive Analytics Dashboard

The dashboard provides an overview of customer feedback and associated metrics.

It serves as the central interface for exploring the available feedback data and navigating the application's major sections.

**Value:** Helps users begin investigating feedback without manually inspecting every record.

### 2. Feedback Management

The feedback interface supports working with customer review records.

Depending on the selected view and request parameters, users can:

- Browse feedback entries.
- Search for relevant reviews.
- Filter feedback by category.
- Sort feedback records.
- Navigate paginated results.
- Submit new feedback.

**Value:** Makes feedback easier to locate, inspect, and organize.

### 3. CSV Import and Export

InsightFlow includes CSV-based data handling for working with customer feedback datasets.

The backend provides an import endpoint, while the interface includes feedback import and export functionality.

**Value:** Supports working with existing feedback data instead of requiring every review to be entered manually.

### 4. AI-Assisted Feedback Classification

InsightFlow uses a supervised machine-learning classifier to predict a category for a customer review.

The baseline classification pipeline uses:

- TF-IDF text vectorization.
- Unigrams and bigrams.
- Logistic Regression.

The prediction workflow can return a predicted category, confidence information, and a human-review indicator.

**Value:** Provides an initial classification suggestion that can help organize incoming feedback.

> The classifier is a conventional supervised machine-learning model, not a generative AI model. Its predictions can be incorrect and should be reviewed when appropriate.

### 5. Prediction Confidence and Human Review

The prediction workflow includes confidence information and a mechanism for flagging predictions that may require human attention.

A confidence score indicates the model's estimated confidence in its prediction. It does not establish that the prediction is correct.

**Value:** Helps users recognize situations where additional review may be useful.

### 6. Human-in-the-Loop Corrections

Users can submit corrections when the predicted category does not match the intended category.

The backend provides a correction workflow, and supporting Python scripts are available for fetching verified corrections and preparing data for subsequent model training.

**Value:** Creates a structured way to identify model errors and prepare improved training data.

### 7. Model Training and Evaluation Workflow

The project includes Python scripts supporting:

- Initial classifier training.
- Model prediction.
- Correction retrieval.
- Retraining data preparation.
- Candidate-model training and evaluation.

The intended workflow separates correction collection from model retraining and model replacement.

**Value:** Establishes a foundation for controlled model improvement rather than automatically accepting every correction as a reliable training label.

### 8. Persistent Application Data

SQLite, accessed through `better-sqlite3`, provides application data storage.

This supports backend data operations without requiring a separate database server for local development.

**Value:** Keeps the initial application architecture relatively simple to configure and run.

---

## How It Works

The application connects a React frontend, an Express backend, a SQLite database, and a Python machine-learning process.

### Application Workflow

```text
                User
                 |
                 v
       React + Vite Frontend
                 |
                 | HTTP / JSON
                 v
          Express.js API
                 |
          +------+------+
          |             |
          v             v
    SQLite Database   Python ML
          |             |
          |             v
          |       Saved Classifier
          |             |
          +------+------+
                 |
                 v
          API Response
                 |
                 v
       Dashboard / UI Update
````

### Feedback Classification Workflow

1. &#x20;A user provides a review through the application.&#x20;
2. &#x20;The frontend sends the review to the Express API.&#x20;
3. &#x20;The backend invokes the Python prediction script.&#x20;
4. &#x20;TF-IDF converts the review text into numerical features.&#x20;
5. &#x20;Logistic Regression predicts the review category.&#x20;
6. &#x20;The prediction result is returned to the frontend.&#x20;
7. &#x20;The user can inspect the prediction and submit a correction if necessary.&#x20;

### Human-in-the-Loop Model Improvement

The intended improvement workflow is:

```
Customer Review
      |
      v
Model Prediction
      |
      v
Human Review
      |
      v
Correction Submission
      |
      v
Correction Verification
      |
      v
Retraining Dataset Preparation
      |
      v
Candidate Model Training
      |
      v
Model Evaluation
      |
      v
Deliberate Model Promotion
```

The correction, verification, retraining, evaluation, and promotion stages are separate steps. A submitted correction does not immediately update the live classifier.

---

## Machine Learning Pipeline

### Model Architecture

The baseline classifier uses TF-IDF vectorization followed by Logistic Regression.

**TF-IDF (Term Frequency–Inverse Document Frequency)** represents text using numerical features based on the importance of words and word combinations.

The configured vectorizer uses unigrams and bigrams, allowing the model to learn from individual words as well as two-word combinations.

**Logistic Regression** uses those features to predict one of the feedback categories learned during training.

### Baseline Configuration

The training configuration documented in the project includes:

| Setting                  | Configuration                       |
| ------------------------ | ----------------------------------- |
| Text representation      | TF-IDF                              |
| N-gram range             | Unigrams and bigrams `(1, 2)`       |
| Sublinear term frequency | Enabled                             |
| Classifier               | Logistic Regression                 |
| Train/test split         | Stratified 80/20 split              |
| Random seed              | `42`                                |
| Maximum iterations       | `3000`                              |
| Class weighting          | `balanced`                          |
| Regularization parameter | `C = 2.0`                           |
| Model artifact           | `models/feedback_classifier.joblib` |

These settings describe the documented training configuration. Actual model behavior and evaluation results depend on the model artifact and the latest successful training run.

### Prediction Output

The prediction workflow is designed to provide information such as:

- &#x20;The original review.&#x20;
- &#x20;The predicted category.&#x20;
- &#x20;The model's confidence score.&#x20;
- &#x20;Whether human review is recommended.&#x20;
- &#x20;A model-version label.&#x20;

The exact output depends on the current backend and model implementation.

---

## Adaption Labs Exploration

InsightFlow was developed in the context of a hackathon challenge requiring meaningful exploration of Adaption Labs within an AI or data-processing workflow.

The project explored Adaption Labs capabilities, including Adaptive Data and AutoScientist, to investigate potential improvements to customer feedback classification.

### Intended Application

**Adaptive Data**

The intended use was to explore preparing or adapting customer feedback data for the classification task.

**AutoScientist**

The intended use was to investigate experimentation and optimization approaches for the feedback classification workflow.

### Current Implementation Status

The project also includes a local TF-IDF + Logistic Regression classifier and a human-in-the-loop correction workflow.

However, the following distinctions are important:

- &#x20;Exploring a platform capability does not establish that an adaptation job completed successfully.&#x20;
- &#x20;Retrieving or inspecting available models does not establish that AutoScientist completed a training or optimization run.&#x20;
- &#x20;Configuring an API key or SDK does not, by itself, demonstrate a successful model adaptation.&#x20;
- &#x20;Collecting corrections does not automatically retrain or replace the deployed model.&#x20;

A completed Adaptive Data job and a completed AutoScientist training run have not been independently verified in the project history available for this documentation.

Accordingly, this README does not claim that Adaption Labs automatically improved the deployed classifier.

---

## Technology Stack

| Technology            | Purpose                                | Where It Is Used                            |
| --------------------- | -------------------------------------- | ------------------------------------------- |
| React                 | Frontend user interface                | Dashboard and application views             |
| Vite                  | Frontend development and build tooling | Frontend project                            |
| JavaScript            | Application logic                      | Frontend and API interactions               |
| Node.js               | Backend runtime                        | Express server                              |
| Express.js            | HTTP API framework                     | Feedback, analysis, and prediction routes   |
| SQLite                | Relational data storage                | Application data                            |
| `better-sqlite3`      | SQLite integration                     | Node.js backend                             |
| Python                | Machine-learning execution             | Training and prediction scripts             |
| pandas                | Tabular data processing                | Dataset and retraining workflows            |
| scikit-learn          | Machine-learning implementation        | TF-IDF and Logistic Regression              |
| joblib                | Model serialization                    | Saving and loading classifier artifacts     |
| Multer                | Multipart file handling                | CSV upload workflow                         |
| CSV parsing utilities | Structured data import                 | Feedback dataset processing                 |
| Framer Motion         | UI animation                           | Frontend interactions                       |
| Lucide React          | Interface icons                        | Frontend components                         |
| Fetch API             | HTTP communication                     | Frontend-to-backend requests                |
| Git and GitHub        | Version control and source hosting     | Project development                         |
| Vercel                | Frontend hosting                       | Deployed web application                    |
| Render                | Backend hosting                        | Deployed Express API                        |
| Adaption Labs         | AI/data workflow exploration           | Adaptive Data and AutoScientist exploration |

---

## Architecture

InsightFlow follows a client-server architecture.

### Frontend

The React frontend provides the user interface for:

- &#x20;Viewing dashboard information.&#x20;
- &#x20;Browsing feedback.&#x20;
- &#x20;Submitting feedback.&#x20;
- &#x20;Importing and exporting feedback data.&#x20;
- &#x20;Interacting with the classifier.&#x20;
- &#x20;Submitting prediction corrections.&#x20;

Vite provides the frontend development server and production build process.

### Backend

The Express backend exposes HTTP endpoints for:

- &#x20;Dashboard data.&#x20;
- &#x20;Feedback retrieval and submission.&#x20;
- &#x20;Feedback activity.&#x20;
- &#x20;CSV import.&#x20;
- &#x20;Analysis.&#x20;
- &#x20;AI prediction.&#x20;
- &#x20;Correction submission and related workflows.&#x20;

### Data Layer

SQLite stores application data through the `better-sqlite3` package.

### Machine-Learning Layer

Python scripts perform model training and prediction using scikit-learn and serialized model artifacts.

The backend invokes the relevant Python scripts when the corresponding machine-learning endpoints are called.

---

## Feedback Categories

The classifier is designed to predict four target categories.

| Category             | Description                                                                   | Example                                         |
| -------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------- |
| `Product Feedback`   | Opinions about product quality, features, usability, or performance           | "The product feels poorly made."                |
| `Customer Service`   | Feedback about support, staff interactions, or service quality                | "Customer support never responds to my emails." |
| `Operational Issues` | Technical failures, payment problems, delays, or workflow disruptions         | "The app crashes whenever I make a payment."    |
| `Fraud and Scam`     | Reports of suspected scams, unauthorized transactions, or suspicious activity | "Someone used my account without permission."   |

These categories represent the project's target labels. The examples are illustrative, and actual model predictions may differ.

High-impact reports, particularly those involving suspected fraud, should be reviewed by an appropriate person rather than handled solely on the basis of a model prediction.

---

## Dataset and Evaluation

The project uses:

`BuildBattle_2026_Customer_Feedback_Dataset.csv`

The dataset is documented as containing approximately 7,000 rows across four categories, with `review` and `category` columns.

### Evaluation Considerations

An earlier local baseline run reported:

- **Accuracy:** 96.88%&#x20;
- **Macro F1:** 0.9550&#x20;

These figures are historical results from a 64-example test split. They are not a guarantee of performance on new or real-world customer feedback.

The dataset contains repeated examples and relatively few unique review/category pairs. Duplicate or near-duplicate examples can make evaluation overly optimistic if similar records appear in both training and test sets.

The updated training workflow is intended to remove duplicate reviews with conflicting labels and use a stratified split. Further evaluation on genuinely unseen, deduplicated data remains important.

For meaningful evaluation, consider reporting:

- &#x20;Accuracy.&#x20;
- &#x20;Precision and recall by category.&#x20;
- &#x20;Macro F1.&#x20;
- &#x20;A confusion matrix.&#x20;
- &#x20;Performance on a deduplicated holdout dataset.&#x20;

Always use the metrics from the latest successful training run rather than assuming historical results still apply.

---

## Project Structure

The following is a simplified representation of the documented project structure. Generated model files may not exist until the relevant scripts have been run.

```
InsightFlow/
├── server.js
├── package.json
├── .env
├── BuildBattle_2026_Customer_Feedback_Dataset.csv
├── models/
│   ├── feedback_classifier.joblib
│   ├── training_metrics.json
│   └── candidate_classifier.joblib
├── scripts/
│   ├── analysis/
│   │   └── analyze_feedback.py
│   └── ml/
│       ├── train_classifier.py
│       ├── predict_feedback.py
│       ├── fetch_corrections.py
│       ├── prepare_retraining_data.py
│       └── train_candidate.py
└── frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── App.jsx
        ├── App.css
        ├── index.css
        ├── main.jsx
        ├── api/
        │   └── api.js
        ├── components/
        ├── hooks/
        ├── pages/
        └── styles/
```

This tree is intended to describe the major application components, not every file in the repository. Confirm it against the current repository before treating it as exhaustive.

---

## Getting Started

### Prerequisites

Install the following software:

- &#x20;Node.js and npm.&#x20;
- &#x20;Python 3.&#x20;
- &#x20;Git, if cloning the repository.&#x20;

The backend also requires the project's Node.js dependencies and the Python packages used by its analysis and machine-learning scripts.

### 1. Clone the Repository

Replace the placeholder with the actual GitHub repository URL.

```
git clone <YOUR_REPOSITORY_URL>
cd InsightFlow
```

If you already have the project locally, open its root directory instead.

### 2. Create a Python Virtual Environment

On Windows PowerShell:

```
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell prevents activation, the virtual environment's Python executable can be invoked directly.

### 3. Install Python Dependencies

Install the packages used by the documented machine-learning workflow:

```
python -m pip install pandas scikit-learn joblib vaderSentiment
```

Additional packages may be required by individual scripts or the current backend implementation. Install any dependencies explicitly imported by those scripts.

### 4. Train the Baseline Classifier

Run this command from the project root:

```
.\.venv\Scripts\python.exe scripts\ml\train_classifier.py
```

The training script is intended to read the feedback dataset and save the trained model artifact.

Confirm that the dataset exists and that training completes successfully before starting the prediction workflow.

### 5. Install Frontend Dependencies

```
cd frontend
npm install
```

### 6. Configure the Environment

Create the necessary local environment files using the configuration described below.

Do not commit real API keys, database credentials, or other secrets.

### 7. Start the Application

The frontend and backend run separately during local development.

Start the backend from the project root using the script defined in the root `package.json`.

For the frontend, open another terminal:

```
cd frontend
npm run dev
```

Use the actual scripts in each `package.json` as the source of truth for available commands.

---

## Environment Configuration

### Frontend

The frontend uses the `VITE_API_BASE_URL` environment variable to determine the API base URL.

For local development, the API helper defaults to:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

For the deployed frontend, the configured value is:

```
VITE_API_BASE_URL=https://insightflow-7j39.onrender.com/api
```

Vite exposes variables prefixed with `VITE_` to browser code. **Never put private API keys or other secrets in a `VITE_` variable.**

### Backend

The backend uses environment variables for deployment and configuration.

Relevant variables include:

| Variable           | Purpose                                                             |
| ------------------ | ------------------------------------------------------------------- |
| `PORT`             | Port supplied by the hosting environment                            |
| `FRONTEND_URL`     | Frontend origin allowed by the backend's CORS configuration         |
| `DB_PATH`          | Optional SQLite database path                                       |
| `PYTHON_PATH`      | Optional path to the Python executable                              |
| `ADAPTION_API_KEY` | Adaption Labs credential, if required by the configured integration |

The deployed frontend origin is:

```
FRONTEND_URL=https://insight-flow-drab-one.vercel.app
```

Do not include a trailing slash in the frontend origin.

The Adaption Labs API key must remain on the backend and should only be configured if required by the integration being used.

### Example Backend Configuration

A local backend environment file may resemble the following:

```
PORT=5000
FRONTEND_URL=http://localhost:5173
DB_PATH=./insightflow.db
```

Add any other variables required by the actual implementation. Do not replace existing configuration blindly, and do not commit the real `.env` file.

---

## Running the Application

### Backend

From the project root, use the command defined in the root `package.json`.

The project has used these scripts:

```
npm install
npm start
```

For development, the root package has also been configured with a Node.js watch command:

```
npm run dev
```

Verify the current `package.json` before relying on these commands.

### Frontend

From the `frontend` directory:

```
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

### Verify the Backend

The deployed backend exposes a health endpoint:

**Live health check:**\
&#x20;https\://insightflow-7j39.onrender.com/api/health

The overview endpoint can also be checked directly:

**Live overview API:**\
&#x20;[https://insightflow-7j39.onrender.com/api/overview](https://insightflow-7j39.onrender.com/api/overview)

The overview endpoint returns JSON data when the backend and its data source are functioning correctly.

---

## API Reference

The Express backend exposes the following documented routes.

| Method  | Endpoint                         | Purpose                                                              |
| ------- | -------------------------------- | -------------------------------------------------------------------- |
| `GET`   | `/api/health`                    | Check API availability                                               |
| `GET`   | `/api/overview`                  | Retrieve overview data                                               |
| `GET`   | `/api/feedback`                  | Retrieve feedback records                                            |
| `POST`  | `/api/feedback`                  | Submit a feedback record                                             |
| `GET`   | `/api/feedback/activity`         | Retrieve feedback activity                                           |
| `POST`  | `/api/feedback/import`           | Import feedback from a CSV file                                      |
| `POST`  | `/api/analysis`                  | Run feedback analysis                                                |
| `POST`  | `/api/ai/predict`                | Predict a feedback category                                          |
| `POST`  | `/api/ai/corrections`            | Submit a human correction                                            |
| `GET`   | `/api/ai/corrections`            | Retrieve correction records, subject to backend filters and behavior |
| `PATCH` | `/api/ai/corrections/:id/verify` | Verify a correction, if enabled in the current backend               |

The exact request and response schemas should be confirmed against the current `server.js` implementation.

### Feedback Query Parameters

The feedback endpoint supports query parameters used by the frontend, including:

- `page`&#x20;
- `limit`&#x20;
- `search`&#x20;
- `category`&#x20;
- `sort`&#x20;
- `includeDuplicates`&#x20;

Example:

```
GET /api/feedback?page=1&limit=10&search=&category=&sort=newest&includeDuplicates=false
```

### Prediction Endpoint

**Endpoint**

```
POST /api/ai/predict
Content-Type: application/json
```

**Request body**

```
{
  "review": "The app crashes whenever I try to make a payment."
}
```

The endpoint invokes the Python classifier and returns a prediction response.

An illustrative response may look like this:

```
{
  "success": true,
  "prediction": {
    "review": "The app crashes whenever I try to make a payment.",
    "predicted_category": "Operational Issues",
    "confidence": 0.91,
    "needs_human_review": false,
    "model_version": "baseline-v1"
  }
}
```

**The response above is illustrative, not a guaranteed output.** The actual response depends on the deployed backend, the current model artifact, and the implementation.

### Common API Issues

| Symptom                     | Possible explanation                                         |
| --------------------------- | ------------------------------------------------------------ |
| `404 Not Found`             | Incorrect route or deployment configuration                  |
| `500 Internal Server Error` | Backend processing, data, or dependency failure              |
| Browser CORS error          | The frontend origin is not allowed by the backend            |
| Prediction failure          | Missing model artifact, Python dependency, or script failure |
| Slow initial response       | The hosting service may need to wake from an idle state      |
| Missing dashboard data      | API request failure or frontend data-handling issue          |

---

## Deployment

InsightFlow is deployed using separate frontend and backend services.

### Frontend — Vercel

Live application:

[https://insight-flow-drab-one.vercel.app/](https://insight-flow-drab-one.vercel.app/)

The frontend is built with React and Vite.

The deployment requires the correct production environment variable:

```
VITE_API_BASE_URL=https://insightflow-7j39.onrender.com/api
```

If this value changes, rebuild and redeploy the frontend so the new environment variable is included in the generated assets.

### Backend — Render

Backend service:

[https://insightflow-7j39.onrender.com](https://insightflow-7j39.onrender.com)

The backend uses Node.js and Express.

Its deployment must provide:

- &#x20;The Node.js dependencies.&#x20;
- &#x20;The required dataset or configured data source.&#x20;
- &#x20;The Python runtime and dependencies needed by analysis and prediction routes.&#x20;
- &#x20;The trained model artifact required for prediction.&#x20;
- &#x20;The correct frontend origin in the CORS configuration.&#x20;
- &#x20;Persistent storage if SQLite data must survive service restarts or redeployments.&#x20;

### Production Considerations

Before relying on the application for real business decisions, verify that:

- &#x20;All required Python scripts and model artifacts are available in the deployed service.&#x20;
- &#x20;SQLite storage is configured appropriately for the hosting environment.&#x20;
- &#x20;The frontend and backend origins are configured correctly.&#x20;
- &#x20;The production build works against the deployed API.&#x20;
- &#x20;Model predictions and correction workflows have been tested end to end.&#x20;

---

## Security and Privacy

InsightFlow is a prototype and should not be considered production-hardened without additional review.

Important considerations include:

- &#x20;Keep API keys and secrets on the backend.&#x20;
- &#x20;Do not commit `.env` files containing credentials.&#x20;
- &#x20;Validate feedback submissions and uploaded files.&#x20;
- &#x20;Apply appropriate CSV upload size and content restrictions.&#x20;
- &#x20;Restrict correction verification to authorized users before exposing it in a production environment.&#x20;
- &#x20;Use appropriate input validation and error handling.&#x20;
- &#x20;Configure persistent storage carefully if feedback contains sensitive information.&#x20;
- &#x20;Avoid sending confidential customer feedback to external services without appropriate authorization and privacy review.&#x20;

Machine-learning predictions should support human decision-making rather than replace appropriate investigation, especially for fraud reports or other high-impact issues.

---

## Known Limitations

The current implementation has several limitations to consider.

### Model Reliability

The classifier can misclassify short, ambiguous, sarcastic, mixed-topic, or unfamiliar reviews.

A high confidence score does not guarantee correctness.

### Dataset Quality

Repeated or near-duplicate examples can inflate evaluation metrics. Results should be validated on a representative, deduplicated dataset.

### Human Corrections

Submitting a correction does not immediately update the live classifier.

Corrections require suitable verification, dataset preparation, candidate training, and evaluation before a new model should be considered for deployment.

### Adaption Labs Integration

Adaptive Data and AutoScientist were explored, but a completed adaptation job and a completed AutoScientist training run have not been verified. The deployed classifier should therefore not be described as automatically improved by Adaption Labs.

### Production Readiness

The prototype requires additional security, validation, monitoring, and testing before being used as the sole basis for important business decisions.

---

## Future Improvements

Potential improvements include:

- **More robust evaluation:** Test against a deduplicated, untouched holdout dataset.&#x20;
- **Better classification quality:** Expand and balance the labelled training dataset.&#x20;
- **Correction verification:** Add authorization, role-based access, and an audit trail.&#x20;
- **Controlled retraining:** Automate candidate evaluation while retaining explicit model-promotion safeguards.&#x20;
- **Model monitoring:** Track category-level precision, recall, macro F1, and changes in input data.&#x20;
- **Adaption Labs integration:** Complete and document a verified Adaptive Data or AutoScientist workflow, then evaluate its effect against the local baseline.&#x20;
- **Operational reliability:** Improve logging, error reporting, and dependency checks.&#x20;
- **Security:** Add suitable request limits, validation, and access controls.&#x20;
- **Testing:** Introduce automated API tests and end-to-end verification.&#x20;
- **Deployment reliability:** Verify persistent database storage and model-artifact availability after redeployment.&#x20;

These are potential improvements, not claims about features already implemented.

---

## Testing and Quality Assurance

The project includes a local model-training and prediction workflow, along with scripts intended to support correction retrieval and candidate-model evaluation.

The following should be verified before each release:

- &#x20;Backend health endpoint responds successfully.&#x20;
- &#x20;Dashboard and feedback endpoints return the expected data.&#x20;
- &#x20;Feedback submissions and CSV imports behave correctly.&#x20;
- &#x20;Prediction requests can load the deployed model.&#x20;
- &#x20;Invalid inputs produce appropriate errors.&#x20;
- &#x20;Correction records are stored and retrieved as intended.&#x20;
- &#x20;Candidate models are evaluated before promotion.&#x20;
- &#x20;The production frontend can access the backend without CORS errors.&#x20;

Automated test coverage and comprehensive end-to-end test results have not been established in this documentation.

---

## Contributing

Contributions and suggestions are welcome.

For local development:

1. &#x20;Fork or clone the repository.&#x20;
2. &#x20;Create a branch for your change.&#x20;
3. &#x20;Install the required Node.js and Python dependencies.&#x20;
4. &#x20;Make your changes.&#x20;
5. &#x20;Run the relevant application workflows and tests.&#x20;
6. &#x20;Submit a pull request describing the change.&#x20;

Please avoid committing secrets, private datasets, generated credentials, or unnecessary model artifacts.

---

## Acknowledgements

InsightFlow was developed for the **Build Battle 2026 AI × Web Development Hackathon**, organized by Frontend Arena.

The project explores practical machine-learning workflows for customer feedback classification and investigates how adaptation tooling could support future improvements.

The application uses open-source technologies including React, Vite, Express, SQLite, Python, and scikit-learn.

Adaption Labs capabilities were explored as part of the project's AI/data workflow investigation.

---

## License

No license has been confirmed for this repository.

Until a license is added, do not assume that the project is available for unrestricted reuse, modification, or redistribution.

---

## Project Links

- **Live application:** [https://insight-flow-drab-one.vercel.app/](https://insight-flow-drab-one.vercel.app/)&#x20;
- **Backend API:** [https://insightflow-7j39.onrender.com](https://insightflow-7j39.onrender.com)&#x20;
- **API health check:** https\://insightflow-7j39.onrender.com/api/health&#x20;
- **Overview endpoint:** [https://insightflow-7j39.onrender.com/api/overview](https://insightflow-7j39.onrender.com/api/overview)&#x20;
- **GitHub repository:** [https://github.com/hrx0508/InsightFlow] URL.&#x20;

---

<p align="center">
  <strong>InsightFlow</strong><br>
  Turning customer feedback into clearer, more actionable insights.
</p>
