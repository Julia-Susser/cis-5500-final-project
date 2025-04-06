const { Pool, types } = require('pg');
const config = require('./config.json')

// Import route handlers
const { pickupsDropoffs, collisionsInjuries, fareTripDistance, safetyRanking, validLocations } = require('./routes/locationRoutes');
const { peakHoursAnalysis, tipAnalysis, collisionHotspots, proximityAnalysis } = require('./routes/areaRoutes');
const { safetyBySeason, collisionRate, accidentSpikes, sameCollisionDateHours } = require('./routes/timeRoutes');

module.exports = {
  // Location routes (Queries 1-5)
  pickupsDropoffs,
  collisionsInjuries,
  fareTripDistance,
  safetyRanking,
  validLocations,
  
  // Time routes (Queries 6-9)
  safetyBySeason,
  collisionRate,
  accidentSpikes,
  sameCollisionDateHours,
  
  // Area routes (Queries 10-12)
  peakHoursAnalysis,
  tipAnalysis,
  collisionHotspots,
  proximityAnalysis
};
