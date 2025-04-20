const { Pool, types } = require('pg');
const config = require('./config.json')

// Import route handlers
const { pickupsDropoffs, collisionsInjuries, fareTripDistance, safetyRanking, validLocations, getNYCGeometry, getNYCGeometryMap } = require('./routes/locationRoutes');
const { peakHoursAnalysis, tipAnalysis, collisionHotspots, proximityAnalysis, collisionsOnStreet } = require('./routes/areaRoutes');
const { safetyBySeason, collisionRate, sameCollisionDateHours } = require('./routes/timeRoutes');
const { weeklyCollisions } = require('./routes/safetyRoutes');

module.exports = {
  // Location routes (Queries 1-5)
  pickupsDropoffs,
  collisionsInjuries,
  fareTripDistance,
  safetyRanking,
  validLocations,
  getNYCGeometry,
  getNYCGeometryMap,
  // Time routes (Queries 6-8)
  safetyBySeason,
  collisionRate,
  sameCollisionDateHours,
  
  // Area routes (Queries 9-13)
  peakHoursAnalysis,
  tipAnalysis,
  collisionHotspots,
  proximityAnalysis,
  collisionsOnStreet,

  // Safety routes (Query 14)
  weeklyCollisions,
};
