import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./ProductDetailPage.css";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= (hovered || value) ? "star-btn--active" : ""}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="review-card">
      <div className="review-card__header">
        <span className="review-card__author">{review.customer_name}</span>
        <span className="review-card__stars">
          {"★".repeat(review.rating)}
          {"☆".repeat(5 - review.rating)}
        </span>
        <span className="review-card__date">
          {new Date(review.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
      {review.comment && (
        <p className="review-card__comment">{review.comment}</p>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart, items } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Review form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const isCustomer =
    user &&
    ["customer", "CUSTOMER", "COMMUNITY_GROUP", "RESTAURANT"].includes(
      user.role_name || user.role,
    );

  const fetchReviews = async () => {
    try {
      const res = await apiFetch(`/products/${id}/reviews/`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setAvgRating(data.average_rating);
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await apiFetch(`/products/${id}/`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setProduct(data);
      } catch {
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    fetchReviews();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating) {
      setSubmitError("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await apiFetch(`/products/${id}/reviews/`, {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || "Failed to submit review.");
      }
      setSubmitted(true);
      setRating(0);
      setComment("");
      fetchReviews();
    } catch (err) {
      setSubmitError(err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const cartItem = items.find((i) => i.id === product?.id);

  if (loading)
    return (
      <main className="product-detail">
        <p className="product-detail__state">Loading…</p>
      </main>
    );
  if (error)
    return (
      <main className="product-detail">
        <p className="product-detail__state product-detail__state--error">
          {error}
        </p>
      </main>
    );

  return (
    <main className="product-detail">
      {/* ── Breadcrumb ── */}
      <nav className="product-detail__breadcrumb">
        <Link to="/products">← Back to products</Link>
      </nav>

      {/* ── Product info ── */}
      <div className="product-detail__top">
        <div className="product-detail__image-wrap">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="product-detail__image"
            />
          ) : (
            <div className="product-detail__image--placeholder">No image</div>
          )}
        </div>

        <div className="product-detail__info">
          <p className="product-detail__category">{product.category}</p>
          <h1 className="product-detail__name">{product.name}</h1>
          <p className="product-detail__producer">by {product.producer_name}</p>

          {avgRating && (
            <div className="product-detail__avg-rating">
              <span className="avg-rating__stars">
                {"★".repeat(Math.round(avgRating))}
                {"☆".repeat(5 - Math.round(avgRating))}
              </span>
              <span className="avg-rating__value">{avgRating} / 5</span>
              <span className="avg-rating__count">
                ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}

          {product.organic_status === "ORGANIC" && (
            <span className="product-detail__badge">Organic</span>
          )}

          <p className="product-detail__description">{product.description}</p>

          {product.allergens?.length > 0 && (
            <div style={{ margin: '12px 0', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '0.85rem', color: '#991b1b' }}>⚠ Allergen Warning</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {product.allergens.map(a => (
                  <span key={a} style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="product-detail__footer">
            <span className="product-detail__price">
              {product.discounted_price ? (
                <>
                  <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.95rem', marginRight: 8 }}>
                    £{parseFloat(product.price).toFixed(2)}
                  </span>
                  <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                    £{parseFloat(product.discounted_price).toFixed(2)}
                  </span>
                </>
              ) : (
                <>£{parseFloat(product.price).toFixed(2)}</>
              )}
              <span className="product-detail__unit"> / {product.unit_amount}</span>
            </span>
            {product.deals?.length > 0 && product.deals[0].expires_at && (
              <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '4px 0 0' }}>
                Deal expires: {new Date(product.deals[0].expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
            <button
              className={`product-detail__btn ${cartItem ? "product-detail__btn--added" : ""}`}
              onClick={() => addToCart(product)}
            >
              {cartItem ? `In cart (${cartItem.quantity})` : "Add to cart"}
            </button>
          </div>

        </div>
      </div>

      {/* ── Reviews section ── */}
      <section className="reviews-section">
        <h2 className="reviews-section__title">
          Customer Reviews{" "}
          {reviews.length > 0 && <span>({reviews.length})</span>}
        </h2>

        {/* Submit form — only for logged-in customers */}
        {isCustomer && !submitted && (
          <form className="review-form" onSubmit={handleSubmitReview}>
            <h3 className="review-form__title">Leave a review</h3>
            <StarRating value={rating} onChange={setRating} />
            <textarea
              className="review-form__textarea"
              placeholder="Share your thoughts (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            {submitError && <p className="review-form__error">{submitError}</p>}
            <button
              type="submit"
              className="review-form__btn"
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </form>
        )}

        {submitted && (
          <p className="review-form__success">Thanks for your review!</p>
        )}

        {!isCustomer && !user && (
          <p className="reviews-section__login-prompt">
            <Link to="/login">Log in</Link> to leave a review.
          </p>
        )}

        {reviews.length === 0 ? (
          <p className="reviews-section__empty">
            No reviews yet — be the first!
          </p>
        ) : (
          reviews.map((r) => <ReviewCard key={r.id} review={r} />)
        )}
      </section>
    </main>
  );
}
