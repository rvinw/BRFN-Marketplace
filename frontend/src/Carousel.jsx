import { useState, useEffect, useRef } from "react";

const ChevronLeft = () => <span style={{ color: "white", fontSize: "20px", lineHeight: 1 }}>&#8249;</span>;
const ChevronRight = () => <span style={{ color: "white", fontSize: "20px", lineHeight: 1 }}>&#8250;</span>;

const slides = [
  {
    id: 1,
    title: "Farm Fresh Vegetables",
    subtitle: "Harvested this morning",
    tag: "Vegetables",
    image: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=1200&q=80",
    cta: "Shop Vegetables",
  },
  {
    id: 2,
    title: "Artisan Dairy",
    subtitle: "From local herds",
    tag: "Dairy",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1200&q=80",
    cta: "Shop Dairy",
  },
  {
    id: 3,
    title: "Fresh-Baked Bread",
    subtitle: "Baked every morning",
    tag: "Bakery",
    image: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=1200&q=80",
    cta: "Shop Bakery",
  },
  {
    id: 4,
    title: "Seasonal Preserves",
    subtitle: "Traditional recipes",
    tag: "Preserves",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=1200&q=80",
    cta: "Shop Preserves",
  },
  {
    id: 5,
    title: "Seasonal Picks",
    subtitle: "What's best right now",
    tag: "Seasonal",
    image: "https://images.unsplash.com/photo-1471194402529-8e0f5a675de6?w=1200&q=80",
    cta: "Shop Seasonal",
  },
];

export default function Carousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [paused]);

  return (
    <div
      className="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div className="carousel__track">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`carousel__slide ${i === current ? "carousel__slide--active" : ""}`}
            aria-hidden={i !== current}
          >
            <img
              className="carousel__img"
              src={slide.image}
              alt={slide.title}
            />
            <div className="carousel__overlay" />
            <div className="carousel__content">
              <span className="carousel__tag">{slide.tag}</span>
              <h2 className="carousel__title">{slide.title}</h2>
              <p className="carousel__subtitle">{slide.subtitle}</p>
              <button className="carousel__cta" type="button">
                {slide.cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Prev / Next */}
      <button className="carousel__arrow carousel__arrow--prev" onClick={prev} type="button" aria-label="Previous">
        <ChevronLeft />
      </button>
      <button className="carousel__arrow carousel__arrow--next" onClick={next} type="button" aria-label="Next">
        <ChevronRight />
      </button>

      {/* Dots */}
      <div className="carousel__dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`carousel__dot ${i === current ? "carousel__dot--active" : ""}`}
            onClick={() => setCurrent(i)}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}