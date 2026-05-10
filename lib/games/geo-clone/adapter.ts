import type { RoundAdapter } from "@/lib/multiplayer/types";
import { haversineDistanceMeters, pointsFromDistance } from "./scoring";
import { mulberry32, pickN, seedToInt } from "./seedRng";

export type Location = { lat: number; lng: number; name: string; country: string; heading: number };
export type Guess = { lat: number; lng: number };

export const LOCATIONS: readonly Location[] = [
  { lat: 48.8860, lng: 2.3303, name: "Montmartre", country: "Paris, France", heading: 200 },
  { lat: 40.7209, lng: -74.0007, name: "SoHo", country: "New York, USA", heading: 90 },
  { lat: 35.6938, lng: 139.7034, name: "Shimokitazawa", country: "Tokyo, Japan", heading: 270 },
  { lat: -33.8731, lng: 151.2070, name: "Newtown", country: "Sydney, Australia", heading: 90 },
  { lat: 51.5321, lng: -0.1010, name: "Islington", country: "London, UK", heading: 0 },
  { lat: 41.8892, lng: 12.4761, name: "Trastevere", country: "Rome, Italy", heading: 90 },
  { lat: 37.8080, lng: -122.4177, name: "Fishermans Wharf", country: "San Francisco, USA", heading: 270 },
  { lat: 55.7558, lng: 37.6173, name: "Tverskaya Street", country: "Moscow, Russia", heading: 180 },
  { lat: -22.9140, lng: -43.1786, name: "Santa Teresa", country: "Rio de Janeiro, Brazil", heading: 270 },
  { lat: 1.2838, lng: 103.8591, name: "Raffles Place", country: "Singapore", heading: 0 },
  { lat: 52.5163, lng: 13.3779, name: "Unter den Linden", country: "Berlin, Germany", heading: 90 },
  { lat: -34.5997, lng: -58.3819, name: "Palermo Soho", country: "Buenos Aires, Argentina", heading: 0 },
  { lat: 59.3326, lng: 18.0649, name: "Gamla Stan", country: "Stockholm, Sweden", heading: 180 },
  { lat: 50.0870, lng: 14.4213, name: "Old Town Square", country: "Prague, Czech Republic", heading: 120 },
  { lat: 43.7714, lng: 11.2542, name: "Oltrarno", country: "Florence, Italy", heading: 180 },
  { lat: 47.4979, lng: 19.0402, name: "Chain Bridge", country: "Budapest, Hungary", heading: 0 },
  { lat: 38.7139, lng: -9.1334, name: "Praca do Comercio", country: "Lisbon, Portugal", heading: 0 },
  { lat: 64.1475, lng: -21.9429, name: "Laugavegur", country: "Reykjavik, Iceland", heading: 90 },
  { lat: 37.9755, lng: 23.7348, name: "Plaka", country: "Athens, Greece", heading: 0 },
  { lat: 45.4500, lng: 12.3300, name: "Cannaregio", country: "Venice, Italy", heading: 270 },
  { lat: 60.1674, lng: 24.9514, name: "Esplanade", country: "Helsinki, Finland", heading: 270 },
  { lat: 19.4328, lng: -99.1333, name: "Zocalo", country: "Mexico City, Mexico", heading: 180 },
  { lat: 22.2796, lng: 114.1628, name: "Nathan Road", country: "Hong Kong", heading: 0 },
  { lat: 48.2064, lng: 16.3631, name: "Ringstrasse", country: "Vienna, Austria", heading: 90 },
  { lat: 41.0082, lng: 29.0220, name: "Kadikoy", country: "Istanbul, Turkey", heading: 90 },
  { lat: -33.9215, lng: 18.4221, name: "Long Street", country: "Cape Town, South Africa", heading: 180 },
  { lat: 3.1478, lng: 101.6953, name: "Bukit Bintang", country: "Kuala Lumpur, Malaysia", heading: 270 },
  { lat: 43.6549, lng: -79.4004, name: "Kensington Market", country: "Toronto, Canada", heading: 90 },
  { lat: 52.3676, lng: 4.9041, name: "Dam Square", country: "Amsterdam, Netherlands", heading: 180 },
  { lat: 48.1351, lng: 11.5820, name: "Marienplatz", country: "Munich, Germany", heading: 0 },
  { lat: -41.2865, lng: 174.7762, name: "Lambton Quay", country: "Wellington, New Zealand", heading: 90 },
  { lat: 55.9533, lng: -3.1883, name: "Royal Mile", country: "Edinburgh, UK", heading: 90 },
  { lat: 35.7148, lng: 139.7967, name: "Asakusa", country: "Tokyo, Japan", heading: 0 },
  { lat: 37.4979, lng: 127.0276, name: "Gangnam", country: "Seoul, South Korea", heading: 90 },
  { lat: 19.0596, lng: 72.8295, name: "Bandra", country: "Mumbai, India", heading: 180 },
  { lat: 21.0341, lng: 105.8503, name: "Old Quarter", country: "Hanoi, Vietnam", heading: 90 },
  { lat: 10.7769, lng: 106.7009, name: "District 1", country: "Ho Chi Minh City, Vietnam", heading: 0 },
  { lat: 14.5547, lng: 121.0244, name: "Makati", country: "Manila, Philippines", heading: 90 },
  { lat: -6.2244, lng: 106.8088, name: "Sudirman", country: "Jakarta, Indonesia", heading: 180 },
  { lat: 25.0330, lng: 121.5654, name: "Ximending", country: "Taipei, Taiwan", heading: 90 },
  { lat: 31.6258, lng: -7.9891, name: "Medina", country: "Marrakech, Morocco", heading: 270 },
  { lat: 33.5731, lng: -7.5898, name: "Centre Ville", country: "Casablanca, Morocco", heading: 180 },
  { lat: 32.0586, lng: 34.7705, name: "Florentin", country: "Tel Aviv, Israel", heading: 0 },
  { lat: 50.0617, lng: 19.9377, name: "Rynek Glowny", country: "Krakow, Poland", heading: 90 },
  { lat: 52.2497, lng: 21.0122, name: "Stare Miasto", country: "Warsaw, Poland", heading: 180 },
  { lat: 59.4372, lng: 24.7454, name: "Vanalinn", country: "Tallinn, Estonia", heading: 0 },
  { lat: 56.9495, lng: 24.1052, name: "Vecriga", country: "Riga, Latvia", heading: 90 },
  { lat: 42.6953, lng: 23.3214, name: "Vitosha Boulevard", country: "Sofia, Bulgaria", heading: 0 },
  { lat: 44.8186, lng: 20.4569, name: "Knez Mihailova", country: "Belgrade, Serbia", heading: 180 },
  { lat: 43.8595, lng: 18.4318, name: "Bascarsija", country: "Sarajevo, Bosnia", heading: 90 },
  { lat: 41.7028, lng: 44.7980, name: "Rustaveli Avenue", country: "Tbilisi, Georgia", heading: 0 },
  { lat: 4.5969, lng: -74.0750, name: "La Candelaria", country: "Bogota, Colombia", heading: 270 },
  { lat: -12.1217, lng: -77.0290, name: "Miraflores", country: "Lima, Peru", heading: 90 },
  { lat: -33.4378, lng: -70.6429, name: "Lastarria", country: "Santiago, Chile", heading: 0 },
  { lat: 45.5230, lng: -73.5811, name: "Plateau Mont-Royal", country: "Montreal, Canada", heading: 180 },
  { lat: 49.2832, lng: -123.1067, name: "Gastown", country: "Vancouver, Canada", heading: 90 },
  { lat: 41.9088, lng: -87.6796, name: "Wicker Park", country: "Chicago, USA", heading: 0 },
  { lat: 30.2436, lng: -97.7521, name: "South Congress", country: "Austin, USA", heading: 180 },
  { lat: 45.5252, lng: -122.6819, name: "Pearl District", country: "Portland, USA", heading: 90 },
  { lat: 47.6219, lng: -122.3211, name: "Capitol Hill", country: "Seattle, USA", heading: 0 },
  { lat: 42.3593, lng: -71.0686, name: "Beacon Hill", country: "Boston, USA", heading: 90 },
  { lat: 39.9528, lng: -75.1457, name: "Old City", country: "Philadelphia, USA", heading: 180 },
];

export const geoCloneAdapter: RoundAdapter<Location, Guess> = {
  kind: "round",
  gameKind: "geo_clone",
  displayName: "GeoClone",
  roundCount: 3,
  roundDurationMs: 30_000,
  revealDurationMs: 5_000,
  generateLocations: (seed, count) => {
    const rng = mulberry32(seedToInt(seed));
    return pickN(LOCATIONS, rng, count);
  },
  scoreFromGuess: (guess, target) => {
    const distanceMeters = haversineDistanceMeters(guess, target);
    return { points: pointsFromDistance(distanceMeters), distanceMeters };
  },
  xpFor: (totalPoints) => Math.round(totalPoints / 1000),
  storeKey: "trivia",
};
