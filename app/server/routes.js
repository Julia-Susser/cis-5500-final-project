const { Pool, types } = require('pg');
const config = require('./config.json')


// Import route handlers
const { locationAnalytics, pickupsDropoffs, collisionsInjuries, fareTripDistance, safetyRanking } = require('./routes/locationRoutes');
const { fareAnalysis, tripDistanceAnalysis, peakHoursAnalysis, highFareTripsAnalysis, tipAnalysis } = require('./routes/areaRoutes');
const { highCollisionRate, boroughCollisionComparison, collisionHotspots } = require('./routes/collisionRoutes');
const { safetyBySeason, collisionRate, accidentSpikes, sameCollisionDates } = require('./routes/timeRoutes');

module.exports = {
  locationAnalytics,
  pickupsDropoffs,
  collisionsInjuries,
  fareTripDistance,
  safetyRanking,
  fareAnalysis,
  tripDistanceAnalysis,
  peakHoursAnalysis,
  highFareTripsAnalysis,
  tipAnalysis,
  highCollisionRate,
  boroughCollisionComparison,
  collisionHotspots,
  safetyBySeason,
  collisionRate,
  accidentSpikes,
  sameCollisionDates,
};
