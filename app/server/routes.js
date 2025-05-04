const { Pool, types } = require('pg');
const config = require('./config.json')

// Import route handlers
const { pickupsDropoffs, collisionsInjuries,  safetyRanking, getNYCGeometry, getNYCGeometryMap,   collisionContributingFactors, collisionFactorsByLocation  } = require('./routes/locationRoutes');
const { safetyBySeason, collisionRate,  sameCollisionDateHours, collisionsInDateRange, weeklyCollisions } = require('./routes/timeRoutes');
const {  tipAnalysis, collisionHotspots, proximityAnalysis } = require('./routes/areaRoutes');

module.exports = {

  pickupsDropoffs,
  collisionsInjuries,
  safetyRanking,
  getNYCGeometry,
  getNYCGeometryMap,

  safetyBySeason,
  collisionRate,
  sameCollisionDateHours,
  collisionsInDateRange,
  
  tipAnalysis,
  collisionHotspots,
  proximityAnalysis,

  weeklyCollisions,

  collisionContributingFactors,
  collisionFactorsByLocation 
};
