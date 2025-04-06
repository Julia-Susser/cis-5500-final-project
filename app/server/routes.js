const { Pool, types } = require('pg');
const config = require('./config.json')

// Import route handlers
const { pickupsDropoffs, collisionsInjuries, fareTripDistance, safetyRanking, validLocations } = require('./routes/locationRoutes');
const { peakHoursAnalysis, tipAnalysis, collisionHotspots, proximityAnalysis, collisionsOnStreet } = require('./routes/areaRoutes');
const { safetyBySeason, collisionRate, sameCollisionDateHours } = require('./routes/timeRoutes');

module.exports = {
  // Location routes (Queries 1-5)
  pickupsDropoffs,
  collisionsInjuries,
  fareTripDistance,
  safetyRanking,
  validLocations,
  
  // Time routes (Queries 6-8)
  safetyBySeason,
  collisionRate,
  sameCollisionDateHours,
  
  // Area routes (Queries 9-13)
  peakHoursAnalysis,
  tipAnalysis,
  collisionHotspots,
  proximityAnalysis,
  collisionsOnStreet
};
