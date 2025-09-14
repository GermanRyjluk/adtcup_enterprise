/**
 * @file locationHelper.ts
 * Contiene funzioni di utilità per la geolocalizzazione.
 */

/**
 * Calcola la distanza in metri tra due coordinate geografiche usando la formula di Haversine.
 * @param coords1 Oggetto con latitude e longitude del primo punto.
 * @param coords2 Oggetto con latitude e longitude del secondo punto.
 * @returns La distanza in metri.
 */
export const getHaversineDistance = (
  coords1: { latitude: number; longitude: number },
  coords2: { latitude: number; longitude: number }
): number => {
  const toRad = (x: number) => (x * Math.PI) / 180;

  const R = 6371e3; // Raggio della Terra in metri
  const lat1 = coords1.latitude;
  const lon1 = coords1.longitude;
  const lat2 = coords2.latitude;
  const lon2 = coords2.longitude;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distanza in metri
};
