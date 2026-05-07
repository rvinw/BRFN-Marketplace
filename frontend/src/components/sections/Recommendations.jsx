import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecommendations } from "../../utils/api";
import "./Recommendations.css";

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id || 1;

  useEffect(() => {
    async function loadRecommendations() {
      setLoading(true);
      setError("");

      try {
        const data = await getRecommendations(userId);
        setRecommendations(data.recommendations || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load recommendations.");
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, [userId]);

  return (
    <section className="recommendations-section">
      <div className="recommendations-header">
        <div>
          <h2>Recommended For You</h2>
          <p>Based on your purchase history and reorder behaviour</p>
        </div>
      </div>

      {loading && (
        <p className="recommendations-loading">Loading recommendations...</p>
      )}

      {error && (
        <p className="recommendations-error">{error}</p>
      )}

      {!loading && !error && recommendations.length === 0 && (
        <p className="recommendations-empty">
          No recommendations available.
        </p>
      )}

      {!loading && !error && recommendations.length > 0 && (
        <div className="recommendations-grid">
          {recommendations.map((item) => (
            <div key={item.product_id} className="recommendation-card">
              <h3>{item.product_name}</h3>

              <div className="recommendation-category">
                {item.category}
              </div>

              <div className="recommendation-probability">
                <div className="recommendation-probability-top">
                  <span>Reorder Likelihood</span>
                  <span className="recommendation-score">
                    {item.reorder_probability}%
                  </span>
                </div>

                <div className="recommendation-progress">
                  <div
                    className="recommendation-progress-fill"
                    style={{ width: `${item.reorder_probability}%` }}
                  />
                </div>
              </div>

              <p className="recommendation-reason">
                {item.reason}
              </p>

              <div className="recommendation-footer">
                <span>Bought {item.frequency} times</span>

                <Link to={`/products/${item.product_id}`}>
                  <button>Reorder</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}