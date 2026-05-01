import { useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import "./CommunityPage.css";

const TYPE_TABS = ["All", "Farm Story", "Recipe"];

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StoryIcon({ type }) {
  if (type === "Recipe") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2v20M18 2v4a4 4 0 0 1-4 4H6" />
        <path d="M6 13h8a4 4 0 0 1 4 4v3" />
      </svg>
    );
  }
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22V12" />
      <path d="M12 12C12 12 7 10 5 6c4 0 7 2 7 6z" />
      <path d="M12 12C12 12 17 10 19 6c-4 0-7 2-7 6z" />
    </svg>
  );
}

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    apiFetch("/community-posts/")
      .then((r) => r.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : (data.results ?? []);
        // Only show public posts on the public page
        setPosts(all.filter((p) => p.is_public));
      })
      .catch(() => setError("Could not load community stories."))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeTab === "All"
      ? posts
      : posts.filter((p) => p.post_type === activeTab);

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const farmStories = posts.filter((p) => p.post_type === "Farm Story").length;
  const recipes = posts.filter((p) => p.post_type === "Recipe").length;

  return (
    <div className="community-page">
      {/* ── Hero ── */}
      <div className="community-page__hero">
        <h1 className="community-page__hero-title">Community Stories</h1>
        <p className="community-page__hero-sub">
          Farm updates, seasonal recipes, and stories straight from your local
          producers.
        </p>
        {!loading && !error && posts.length > 0 && (
          <div className="community-page__stats">
            <span className="community-stat">
              <StoryIcon type="Farm Story" />
              {farmStories} farm {farmStories === 1 ? "story" : "stories"}
            </span>
            <span className="community-stat__divider" />
            <span className="community-stat">
              <StoryIcon type="Recipe" />
              {recipes} {recipes === 1 ? "recipe" : "recipes"}
            </span>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="community-page__tabs">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab}
            className={`community-tab ${activeTab === tab ? "community-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab !== "All" && !loading && (
              <span className="community-tab__count">
                {tab === "Farm Story" ? farmStories : recipes}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── States ── */}
      {loading && <p className="community-page__state">Loading stories…</p>}
      {error && (
        <p className="community-page__state community-page__state--error">
          {error}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="community-page__empty">
          {posts.length === 0
            ? "No community stories have been published yet. Check back soon!"
            : `No ${activeTab.toLowerCase()}s published yet.`}
        </div>
      )}

      {/* ── Cards ── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="community-grid">
          {filtered.map((post) => {
            const isLong = post.description?.length > 300;
            const isOpen = expanded[post.id];
            return (
              <article key={post.id} className="community-card">
                <div className="community-card__top">
                  <span
                    className={`community-card__type community-card__type--${post.post_type === "Recipe" ? "recipe" : "story"}`}
                  >
                    <StoryIcon type={post.post_type} />
                    {post.post_type}
                  </span>
                  <span className="community-card__date">
                    {formatDate(post.created_at)}
                  </span>
                </div>

                <h2 className="community-card__title">{post.title}</h2>

                <p
                  className={`community-card__body ${isLong && !isOpen ? "community-card__body--clamped" : ""}`}
                >
                  {post.description}
                </p>

                {isLong && (
                  <button
                    className="community-card__toggle"
                    onClick={() => toggleExpanded(post.id)}
                  >
                    {isOpen ? "Show less ↑" : "Read more ↓"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
