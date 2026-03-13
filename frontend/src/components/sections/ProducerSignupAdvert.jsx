import { Link } from 'react-router-dom'

export default function CommunityEngagement() {
  return (
    <section className="community-section">
      <div className="community-section__inner">
        <h2>Are you a local producer?</h2>
        <p>Join BRFN Marketplace and sell directly to your community.</p>
        <Link to="/register/producer" className="community-section__cta">
          Register as a producer
        </Link>
      </div>
    </section>
  )
}