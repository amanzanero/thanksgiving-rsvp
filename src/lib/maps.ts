/**
 * Link that opens the address in the phone's maps app (or Google Maps in a
 * browser). Uses Google's documented cross-platform URL. `api=1` is required.
 */
export function directionsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}
