const { Pool, types } = require('pg');
const config = require('./config.json')

// Import route handlers
const { pickupsDropoffs, collisionsInjuries,  safetyRanking, getNYCGeometry, getNYCGeometryMap } = require('./routes/locationRoutes');
const { weeklyCollisions } = require('./routes/safetyRoutes');
const { safetyBySeason, collisionRate,  sameCollisionDateHours, collisionsInDateRange } = require('./routes/timeRoutes');
const {  tipAnalysis, collisionHotspots, proximityAnalysis } = require('./routes/areaRoutes');

module.exports = {
  // Location routes (Queries 1-5)
  pickupsDropoffs,
  collisionsInjuries,
  safetyRanking,
  getNYCGeometry,
  getNYCGeometryMap,
  // Time routes (Queries 6-8)
  safetyBySeason,
  collisionRate,
  sameCollisionDateHours,
  collisionsInDateRange,
  
  // Area routes (Queries 9-13)
  tipAnalysis,
  collisionHotspots,
  proximityAnalysis,

  // Safety routes (Query 14)
  weeklyCollisions,
};
