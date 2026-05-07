from django.utils import timezone
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import pandas as pd

from marketplace.models import OrderItem


def load_purchase_history_from_db():
    """
    Load customer purchase history from DESD database.

    Returns:
        DataFrame with:
        user_id, product_id, product_name, category, order_date, quantity
    """
    items = (
        OrderItem.objects
        .select_related(
            "product",
            "product__category",
            "order_producer",
            "order_producer__order",
        )
        .filter(order_producer__order__order_status__in=["PAID", "DELIVERED", "PENDING"])
    )

    rows = []

    for item in items:
        order = item.order_producer.order
        product = item.product

        rows.append({
            "user_id": order.customer_id,
            "product_id": product.id,
            "product_name": product.product_name,
            "category": product.category.category_name if product.category else "Unknown",
            "order_date": order.placed_at,
            "quantity": float(item.quantity),
        })

    return pd.DataFrame(rows)


def prepare_features(df):
    """
    Build user-product feature matrix using purchase history.
    """
    if df.empty:
        return pd.DataFrame(), None

    df["order_date"] = pd.to_datetime(df["order_date"])

    reference_date = df["order_date"].max()

    features = (
        df.groupby(["user_id", "product_id", "product_name", "category"])
        .agg(
            frequency=("product_id", "count"),
            total_quantity=("quantity", "sum"),
            avg_quantity=("quantity", "mean"),
            last_purchase_date=("order_date", "max"),
        )
        .reset_index()
    )

    features["days_since_last_purchase"] = (
        reference_date - features["last_purchase_date"]
    ).dt.days

    features["last_purchase_month"] = features["last_purchase_date"].dt.month

    encoder = LabelEncoder()
    features["category_encoded"] = encoder.fit_transform(features["category"])

    return features, encoder


FEATURE_COLS = [
    "frequency",
    "total_quantity",
    "avg_quantity",
    "days_since_last_purchase",
    "last_purchase_month",
    "category_encoded",
]


def train_runtime_model(features):
    """
    Train a lightweight runtime model from current database purchases.

    If there is not enough data for supervised learning, fallback scoring is used.
    """
    if features.empty or len(features) < 5:
        return None

    # Create practical reorder label:
    # items bought more than once OR bought recently are treated as likely reorder.
    median_recency = features["days_since_last_purchase"].median()

    features["will_reorder"] = (
        (features["frequency"] > 1) |
        (features["days_since_last_purchase"] <= median_recency)
    ).astype(int)

    if features["will_reorder"].nunique() < 2:
        return None

    x = features[FEATURE_COLS]
    y = features["will_reorder"]

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        random_state=42,
        class_weight="balanced",
    )

    model.fit(x, y)

    return model


def fallback_weighted_scores(features):
    """
    Fallback recommendation score when database data is too small for ML.
    """
    if features.empty:
        return features

    def normalise(series):
        if series.max() == series.min():
            return pd.Series([1] * len(series), index=series.index)
        return (series - series.min()) / (series.max() - series.min())

    features["frequency_score"] = (
        features.groupby("user_id")["frequency"].transform(normalise)
    )
    features["quantity_score"] = (
        features.groupby("user_id")["total_quantity"].transform(normalise)
    )

    features["recency_raw"] = 1 / (features["days_since_last_purchase"] + 1)
    features["recency_score"] = (
        features.groupby("user_id")["recency_raw"].transform(normalise)
    )

    features["reorder_probability"] = (
        0.5 * features["frequency_score"] +
        0.3 * features["recency_score"] +
        0.2 * features["quantity_score"]
    )

    features["reorder_probability"] = features["reorder_probability"] * 100

    return features


def get_db_recommendations(user_id, top_n=3):
    """
    Return quick reorder recommendations using real DESD database order history.
    """
    df = load_purchase_history_from_db()

    if df.empty:
        return []

    features, _ = prepare_features(df)

    if features.empty:
        return []

    user_features = features[features["user_id"] == int(user_id)].copy()

    if user_features.empty:
        return []

    model = train_runtime_model(features)

    if model is not None:
        features["reorder_probability"] = (
            model.predict_proba(features[FEATURE_COLS])[:, 1] * 35
        ) + 55
    else:
        features = fallback_weighted_scores(features)

    user_recs = (
        features[features["user_id"] == int(user_id)]
        .sort_values("reorder_probability", ascending=False)
        .head(top_n)
    )

    recommendations = []

    for _, row in user_recs.iterrows():
        recommendations.append({
            "product_id": int(row["product_id"]),
            "product_name": row["product_name"],
            "category": row["category"],
            "frequency": int(row["frequency"]),
            "total_quantity": round(float(row["total_quantity"]), 2),
            "days_since_last_purchase": int(row["days_since_last_purchase"]),
            "reorder_probability": round(float(row["reorder_probability"]), 2),
            "reason": (
                f"Recommended because you previously purchased "
                f"{row['product_name']} {int(row['frequency'])} time(s), "
                f"ordered a total quantity of "
                f"{round(float(row['total_quantity']), 2)}, "
                f"and recently reordered similar products."
            ),
        })

    return recommendations