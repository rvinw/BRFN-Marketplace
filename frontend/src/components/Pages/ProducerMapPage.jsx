import { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { usePostcode } from '../../context/PostcodeContext';
import { apiFetch } from '../../utils/api';
import './ProducerMap.css';

const BRISTOL_CENTER = { lat: 51.4545, lng: -2.5879 };
// Empty array — Geocoder is part of the core Maps JS API, no extra library needed.
// Must be defined outside the component so the reference is stable.
const LIBRARIES = [];

export default function ProducerMapPage() {
  const { postcode } = usePostcode();
  const [producers, setProducers] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [center, setCenter] = useState(BRISTOL_CENTER);
  const [zoom, setZoom] = useState(10);
  const [selected, setSelected] = useState(null);
  const [loadingMarkers, setLoadingMarkers] = useState(false);
  const geocoderRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // Create the Geocoder as soon as the Maps API is loaded
  useEffect(() => {
    if (isLoaded) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);

  // Fetch producers from backend
  useEffect(() => {
    apiFetch('/producers/')
      .then(r => r.json())
      .then(setProducers)
      .catch(() => {});
  }, []);

  const geocode = useCallback((query) =>
    new Promise((resolve) => {
      geocoderRef.current.geocode({ address: query }, (results, status) => {
        resolve(status === 'OK' && results[0] ? results[0].geometry.location : null);
      });
    }), []);

  // Geocode all producers once both the API and producer list are ready
  useEffect(() => {
    if (!isLoaded || !producers.length || !geocoderRef.current) return;

    setLoadingMarkers(true);
    Promise.all(
      producers.map(async (p) => {
        const loc = await geocode(`${p.postcode}, UK`);
        if (!loc) return null;
        return { ...p, lat: loc.lat(), lng: loc.lng() };
      })
    ).then((results) => {
      setMarkers(results.filter(Boolean));
      setLoadingMarkers(false);
    });
  }, [isLoaded, producers, geocode]);

  // Re-centre the map when the user's postcode changes
  useEffect(() => {
    if (!isLoaded || !postcode || !geocoderRef.current) return;
    geocode(`${postcode}, UK`).then((loc) => {
      if (loc) {
        setCenter({ lat: loc.lat(), lng: loc.lng() });
        setZoom(12);
      }
    });
  }, [isLoaded, postcode, geocode]);

  if (loadError) {
    return (
      <div className="producer-map-page">
        <p className="producer-map-error">Failed to load Google Maps. Check your API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="producer-map-page">
        <p className="producer-map-loading">Loading map…</p>
      </div>
    );
  }

  return (
    <div className="producer-map-page">
      <div className="producer-map-header">
        <div>
          <h1>Producer Map</h1>
          <p className="producer-map-subtitle">
            {loadingMarkers
              ? 'Placing producers…'
              : `${markers.length} verified producer${markers.length !== 1 ? 's' : ''} on the map`}
          </p>
        </div>
        {postcode && (
          <div className="producer-map-postcode-tag">
            <PinIcon /> Showing near <strong>{postcode}</strong>
          </div>
        )}
      </div>

      <div className="producer-map-body">
        <GoogleMap
          mapContainerClassName="producer-map-canvas"
          center={center}
          zoom={zoom}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {markers.map((m) => (
            <Marker
              key={m.id}
              position={{ lat: m.lat, lng: m.lng }}
              title={m.business_name}
              onClick={() => setSelected(m)}
            />
          ))}

          {selected && (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              onCloseClick={() => setSelected(null)}
            >
              <div className="map-info-window">
                <strong>{selected.business_name}</strong>
                <span>{selected.address}</span>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {loadingMarkers && (
          <div className="producer-map-overlay">Placing producers on map…</div>
        )}
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75"/>
    </svg>
  );
}
