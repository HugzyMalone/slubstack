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
  { lat: 41.3874, lng: 2.1686, name: "La Rambla", country: "Barcelona, Spain", heading: 200 },
  { lat: 1.2838, lng: 103.8591, name: "Raffles Place", country: "Singapore", heading: 0 },
  { lat: 52.5163, lng: 13.3779, name: "Unter den Linden", country: "Berlin, Germany", heading: 90 },
  { lat: 30.0459, lng: 31.2243, name: "Tahrir Square", country: "Cairo, Egypt", heading: 0 },
  { lat: 13.7468, lng: 100.5345, name: "Khao San Road", country: "Bangkok, Thailand", heading: 90 },
  { lat: 35.0116, lng: 135.7681, name: "Nishiki Market", country: "Kyoto, Japan", heading: 90 },
  { lat: -34.5997, lng: -58.3819, name: "Palermo Soho", country: "Buenos Aires, Argentina", heading: 0 },
  { lat: 59.3326, lng: 18.0649, name: "Gamla Stan", country: "Stockholm, Sweden", heading: 180 },
  { lat: 50.0870, lng: 14.4213, name: "Old Town Square", country: "Prague, Czech Republic", heading: 120 },
  { lat: 43.7714, lng: 11.2542, name: "Oltrarno", country: "Florence, Italy", heading: 180 },
  { lat: 25.2048, lng: 55.2708, name: "Sheikh Zayed Road", country: "Dubai, UAE", heading: 180 },
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
  { lat: 53.3441, lng: -6.2675, name: "Temple Bar", country: "Dublin, Ireland", heading: 0 },
  { lat: 3.1478, lng: 101.6953, name: "Bukit Bintang", country: "Kuala Lumpur, Malaysia", heading: 270 },
  { lat: 43.6549, lng: -79.4004, name: "Kensington Market", country: "Toronto, Canada", heading: 90 },
  { lat: 52.3676, lng: 4.9041, name: "Dam Square", country: "Amsterdam, Netherlands", heading: 180 },
  { lat: 48.1351, lng: 11.5820, name: "Marienplatz", country: "Munich, Germany", heading: 0 },
  { lat: -41.2865, lng: 174.7762, name: "Lambton Quay", country: "Wellington, New Zealand", heading: 90 },
  { lat: 25.7617, lng: -80.1918, name: "Ocean Drive", country: "Miami, USA", heading: 0 },
  { lat: 55.9533, lng: -3.1883, name: "Royal Mile", country: "Edinburgh, UK", heading: 90 },
];

export const geoCloneAdapter: RoundAdapter<Location, Guess> = {
  kind: "round",
  gameKind: "geo_clone",
  displayName: "GeoClone",
  roundCount: 3,
  roundDurationMs: 60_000,
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
