const postcodeCache = {};

/**
 * Fetch lat/lng for a UK postcode from postcodes.io.
 * Returns null if the postcode is invalid or the request fails.
 */
export async function getCoords(postcode) {
  if (!postcode) return null;
  const key = postcode.replace(/\s/g, "").toUpperCase();
  if (postcodeCache[key]) return postcodeCache[key];

  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(key)}`,
    );
    const data = await res.json();
    if (data.status !== 200 || !data.result) return null;
    const coords = { lat: data.result.latitude, lng: data.result.longitude };
    postcodeCache[key] = coords;
    return coords;
  } catch {
    return null;
  }
}

/**
 * Haversine formula, straight-line distance between two lat/lng points in miles.
 */
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Get the food miles between two postcodes.
 * Returns a rounded number of miles, or null if either postcode can't be resolved.
 */
export async function getFoodMiles(customerPostcode, producerPostcode) {
  if (!customerPostcode || !producerPostcode) return null;
  const [c, p] = await Promise.all([
    getCoords(customerPostcode),
    getCoords(producerPostcode),
  ]);
  if (!c || !p) return null;
  return Math.round(haversine(c.lat, c.lng, p.lat, p.lng) * 10) / 10;
}
