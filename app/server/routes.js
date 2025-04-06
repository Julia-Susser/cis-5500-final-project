const { Pool, types } = require('pg');
const config = require('./config.json')


// Import route handlers
const { pickupsDropoffs, collisionsInjuries, fareTripDistance, safetyRanking } = require('./routes/locationRoutes');
const { fareAnalysis, tripDistanceAnalysis, peakHoursAnalysis, highFareTripsAnalysis, tipAnalysis, collisionHotspots, proximityAnalysis } = require('./routes/areaRoutes');
const { safetyBySeason } = require('./routes/timeRoutes');

module.exports = {
  pickupsDropoffs,
  collisionsInjuries,
  fareTripDistance,
  safetyRanking,
  fareAnalysis,
  tripDistanceAnalysis,
  peakHoursAnalysis,
  tipAnalysis,
  collisionHotspots,
  safetyBySeason,
  proximityAnalysis,
  highFareTripsAnalysis
};
