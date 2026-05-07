import { useState } from "react";
import { checkProduceFreshness } from "../../utils/api";
import "./FreshnessCheck.css";

export default function FreshnessCheck() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleImageChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  }

  async function handleCheck() {
    if (!image) {
      setError("Please upload a produce image first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await checkProduceFreshness(image);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Freshness check failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="freshness-section">
      <div className="freshness-header">
        <h2>AI Freshness Check</h2>
        <p>
          Upload a fruit or vegetable image to classify whether it is fresh or rotten.
        </p>
        <p className="freshness-model-note">
          Powered by the integrated MobileNetV2 freshness classification model.
        </p>
      </div>

      <div className="freshness-layout">
        <div className="freshness-upload-card">
          <label className="freshness-upload-box">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            {preview ? (
              <img src={preview} alt="Uploaded produce preview" />
            ) : (
              <span>Click to upload produce image</span>
            )}
          </label>

          <button
            onClick={handleCheck}
            disabled={loading}
            className="freshness-check-button"
          >
            {loading ? "Checking..." : "Run AI Freshness Check"}
          </button>

          {error && <p className="freshness-error">{error}</p>}
        </div>

        {result && (
          <div className="freshness-result-card">
            <div
              className={
                result.is_fresh
                  ? "freshness-status freshness-status--fresh"
                  : "freshness-status freshness-status--rotten"
              }
            >
              {result.is_fresh ? "Fresh" : "Rotten"}
            </div>

            <h3>{result.predicted_class}</h3>

            <p className="freshness-confidence">
              Confidence: {result.confidence}%
            </p>

            <p className="freshness-explanation">
              {result.explanation}
            </p>

            {result.gradcam_base64 && (
              <div className="freshness-gradcam">
                <h4>Grad-CAM Explanation</h4>
                <img
                  src={`data:image/png;base64,${result.gradcam_base64}`}
                  alt="Grad-CAM heatmap"
                />
                <p className="freshness-xai-note">
                The highlighted areas show which image regions influenced the AI decision.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}