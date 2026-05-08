import type { RoundAdapter } from "@/lib/multiplayer/types";
import { haversineDistanceMeters, pointsFromDistance } from "./scoring";
import { mulberry32, pickN, seedToInt } from "./seedRng";

export type Location = { lat: number; lng: number; name: string };
export type Guess = { lat: number; lng: number };

export const LOCATIONS: readonly Location[] = [
  { lat: 48.8860, lng: 2.3303, name: "Montmartre" },
  { lat: 40.7209, lng: -74.0007, name: "SoHo" },
  { lat: 35.6938, lng: 139.7034, name: "Shimokitazawa" },
  { lat: -33.8731, lng: 151.2070, name: "Newtown" },
  { lat: 51.5321, lng: -0.1010, name: "Islington" },
  { lat: 41.8892, lng: 12.4761, name: "Trastevere" },
  { lat: 37.8080, lng: -122.4177, name: "Fishermans Wharf" },
  { lat: 55.7558, lng: 37.6173, name: "Tverskaya Street" },
  { lat: -22.9140, lng: -43.1786, name: "Santa Teresa" },
  { lat: 41.3874, lng: 2.1686, name: "La Rambla" },
  { lat: 1.2838, lng: 103.8591, name: "Raffles Place" },
  { lat: 52.5163, lng: 13.3779, name: "Unter den Linden" },
  { lat: 30.0459, lng: 31.2243, name: "Tahrir Square" },
  { lat: 13.7468, lng: 100.5345, name: "Khao San Road" },
  { lat: 35.0116, lng: 135.7681, name: "Nishiki Market" },
  { lat: -34.5997, lng: -58.3819, name: "Palermo Soho" },
  { lat: 59.3326, lng: 18.0649, name: "Gamla Stan" },
  { lat: 50.0870, lng: 14.4213, name: "Old Town Square" },
  { lat: 43.7714, lng: 11.2542, name: "Oltrarno" },
  { lat: 25.2048, lng: 55.2708, name: "Sheikh Zayed Road" },
  { lat: 47.4979, lng: 19.0402, name: "Chain Bridge" },
  { lat: 38.7139, lng: -9.1334, name: "Praca do Comercio" },
  { lat: 64.1475, lng: -21.9429, name: "Laugavegur" },
  { lat: 37.9755, lng: 23.7348, name: "Plaka" },
  { lat: 45.4500, lng: 12.3300, name: "Cannaregio" },
  { lat: 60.1674, lng: 24.9514, name: "Esplanade" },
  { lat: 19.4328, lng: -99.1333, name: "Zocalo" },
  { lat: 22.2796, lng: 114.1628, name: "Nathan Road" },
  { lat: 48.2064, lng: 16.3631, name: "Ringstrasse" },
  { lat: 41.0082, lng: 29.0220, name: "Kadikoy" },
  { lat: -33.9215, lng: 18.4221, name: "Long Street" },
  { lat: 53.3441, lng: -6.2675, name: "Temple Bar" },
  { lat: 3.1478, lng: 101.6953, name: "Bukit Bintang" },
  { lat: 43.6549, lng: -79.4004, name: "Kensington Market" },
  { lat: 52.3676, lng: 4.9041, name: "Dam Square" },
  { lat: 48.1351, lng: 11.5820, name: "Marienplatz" },
  { lat: -41.2865, lng: 174.7762, name: "Lambton Quay" },
  { lat: 25.7617, lng: -80.1918, name: "Ocean Drive" },
  { lat: 55.9533, lng: -3.1883, name: "Royal Mile" },
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
};
