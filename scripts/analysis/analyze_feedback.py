import json
import re
import sys
from collections import Counter

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


analyzer = SentimentIntensityAnalyzer()

VALID_CATEGORIES = {
    "Product Feedback",
    "Customer Service",
    "Operational Issues",
    "Fraud and Scam",
}


def classify_sentiment(text):
    """
    Classify English feedback using VADER's compound score.
    These are baseline labels, not verified ground truth.
    """
    scores = analyzer.polarity_scores(str(text))
    compound = scores["compound"]

    if compound >= 0.05:
        label = "Positive"
    elif compound <= -0.05:
        label = "Negative"
    else:
        label = "Neutral"

    return {
        "label": label,
        "score": round(compound, 4),
    }


def identify_topics(text):
    """
    Identify possible recurring issues using transparent
    keyword rules. These are candidate topics, not an AI model.
    """
    text = str(text).lower()

    topic_patterns = {
        "App Crashes": [
            r"\bcrash(?:es|ed|ing)?\b",
            r"\bapp (?:closes|closed|closing)\b",
            r"\bkeeps closing\b",
        ],
        "Payment Issues": [
            r"\bpayment\b",
            r"\bcharged\b",
            r"\btransaction failed\b",
            r"\bbilling\b",
            r"\brefund\b",
        ],
        "Login Issues": [
            r"\blog ?in\b",
            r"\bsign ?in\b",
            r"\bpassword\b",
            r"\baccount access\b",
        ],
        "Performance Issues": [
            r"\bslow\b",
            r"\blag(?:s|gy|ging)?\b",
            r"\bfreez(?:e|es|ing)\b",
            r"\bloading\b",
        ],
        "Customer Support": [
            r"\bsupport\b",
            r"\bcustomer service\b",
            r"\bagent\b",
            r"\bresponse time\b",
        ],
        "Fraud and Security": [
            r"\bfraud\b",
            r"\bscam\b",
            r"\bunauthori[sz]ed\b",
            r"\bsuspicious\b",
            r"\bstolen\b",
        ],
    }

    matches = []

    for topic, patterns in topic_patterns.items():
        if any(re.search(pattern, text) for pattern in patterns):
            matches.append(topic)

    return matches or ["Other"]


def analyze_feedback(records):
    """
    Analyze a list of feedback dictionaries.

    Each record should contain:
        id, review, category
    """
    if not records:
        return {
            "success": True,
            "total": 0,
            "sentiment": [],
            "topics": [],
            "categories": [],
            "recommendations": [],
            "feedback": [],
        }

    df = pd.DataFrame(records)

    required = {"review", "category"}

    if not required.issubset(df.columns):
        raise ValueError(
            "Every record must contain review and category fields."
        )

    df["review"] = df["review"].fillna("").astype(str).str.strip()
    df["category"] = df["category"].fillna("Uncategorized").astype(str)

    df = df[df["review"].str.len() > 0].copy()

    if df.empty:
        return {
            "success": True,
            "total": 0,
            "sentiment": [],
            "topics": [],
            "categories": [],
            "recommendations": [],
            "feedback": [],
        }

    sentiment_results = df["review"].apply(classify_sentiment)

    df["sentiment"] = sentiment_results.apply(
        lambda result: result["label"]
    )

    df["sentiment_score"] = sentiment_results.apply(
        lambda result: result["score"]
    )

    df["topics"] = df["review"].apply(identify_topics)

    # Sentiment distribution
    sentiment_counts = Counter(df["sentiment"])

    sentiment = [
        {
            "name": name,
            "count": sentiment_counts.get(name, 0),
            "percentage": round(
                sentiment_counts.get(name, 0) / len(df) * 100, 1
            ),
        }
        for name in ["Positive", "Neutral", "Negative"]
    ]

    # Category distribution
    category_counts = df["category"].value_counts()

    categories = [
        {
            "name": name,
            "count": int(count),
        }
        for name, count in category_counts.items()
    ]

    # Recurring topic statistics
    topic_rows = []

    for topic in sorted({
        topic
        for topics in df["topics"]
        for topic in topics
    }):
        matching = df[
            df["topics"].apply(lambda topics: topic in topics)
        ]

        topic_rows.append({
            "name": topic,
            "count": int(len(matching)),
            "negativeCount": int(
                (matching["sentiment"] == "Negative").sum()
            ),
            "negativePercentage": round(
                (matching["sentiment"] == "Negative").mean() * 100,
                1,
            ),
            "examples": matching["review"].head(3).tolist(),
        })

    topic_rows.sort(
        key=lambda topic: (
            topic["negativeCount"],
            topic["count"],
        ),
        reverse=True,
    )

    # Evidence-based baseline recommendations
    recommendations = []

    for topic in topic_rows:
        if topic["name"] == "Other":
            continue

        if topic["count"] < 2:
            continue

        if topic["negativePercentage"] >= 50:
            recommendations.append({
                "title": f"Investigate {topic['name'].lower()}",
                "priority": (
                    "High"
                    if topic["negativePercentage"] >= 75
                    and topic["count"] >= 5
                    else "Medium"
                ),
                "reason": (
                    f"{topic['count']} feedback entries mention this "
                    f"topic, and {topic['negativePercentage']}% of them "
                    "are negative according to the baseline analyzer."
                ),
                "evidenceCount": topic["count"],
                "negativePercentage": topic["negativePercentage"],
                "action": (
                    f"Review representative complaints about "
                    f"{topic['name'].lower()} and investigate the "
                    "underlying causes."
                ),
            })

    analyzed_feedback = []

    for index, row in df.iterrows():
        analyzed_feedback.append({
            "id": str(row["id"])
            if "id" in df.columns
            else str(index),
            "review": row["review"],
            "category": row["category"],
            "sentiment": row["sentiment"],
            "sentimentScore": row["sentiment_score"],
            "topics": row["topics"],
        })

    return {
        "success": True,
        "total": len(df),
        "sentiment": sentiment,
        "categories": categories,
        "topics": topic_rows,
        "recommendations": recommendations,
        "feedback": analyzed_feedback,
    }


def main():
    """
    Read JSON from stdin and return JSON on stdout.
    This allows the Express backend to call this script.
    """
    try:
        payload = json.load(sys.stdin)
        records = payload.get("feedback", [])

        result = analyze_feedback(records)

        print(json.dumps(result, ensure_ascii=False))

    except Exception as error:
        print(
            json.dumps({
                "success": False,
                "error": str(error),
            }),
            file=sys.stdout,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()