const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));

// =======================
// NYC Taxi Location Routes (Queries 1–5)
// =======================

// Query 1: Retrieves total taxi pickups and drop-offs in a given location.
// Takes: `location_id` as a URL parameter.
app.get('/location/:location_id/pickups_dropoffs', routes.pickupsDropoffs);

// Query 2: Retrieves the number of collisions and injuries recorded in the area.
// Takes: `location_id` as a URL parameter.
app.get('/location/:location_id/collisions_injuries', routes.collisionsInjuries);

// Query 3: Retrieves the average fare and trip distance for rides in the location.
// Takes: `location_id` as a URL parameter.
app.get('/location/:location_id/fare_trip_distance', routes.fareTripDistance);

// Query 4: Retrieves the ranking of the area in terms of safety and taxi availability.
// Takes: `location_id` as a URL parameter.
app.get('/location/:location_id/safety_ranking', routes.safetyRanking);

// Query 5:
// Takes: No parameters.
app.get('/location/nyc_geometry', routes.getNYCGeometry);

// Query 6:
app.get('/location/nyc_geometry_map', routes.getNYCGeometryMap);

// =======================
// Time-Based Safety & Collision Routes (Queries 6–9)
// =======================

// Query 7: Analyzes how safety varies by season (e.g., winter vs. summer).
// Takes: No parameters.
app.get('/time/safety_by_season', routes.safetyBySeason);

// Query 8: Computes collision rate per 1,000 taxi rides at a location in a date range.
// Takes: `start_date`, `end_date`, and `location_id` as query parameters.
app.get('/time/collision_rate', routes.collisionRate);

// Query 9: Finds hours with repeated collisions on the same date.
// Takes: No parameters.
app.get('/time/same_collision_date_hours', routes.sameCollisionDateHours);

// Query 10: Finds collisions in date range
// Takes: date range
app.get('/time/collisions', routes.collisionsInDateRange);

// =======================
// Area-Based Analytics (Queries 11–15)
// =======================

// Query 11: Finds peak hours and most active pickup locations.
// Takes: No parameters.
app.get('/area/peak_hours', routes.peakHoursAnalysis);

// Query 12: Analyzes locations with tip averages above certain thresholds.
// Takes: No parameters.
app.get('/area/tip_analysis', routes.tipAnalysis);

// Query 13: Identifies collision hotspots with very few taxi pickups.
// Takes: No parameters.
app.get('/area/collision_hotspots', routes.collisionHotspots);

// Query 14: Analyzes proximity of collisions to taxi pickups (within 5000 meters).
// Takes: No parameters.
app.get('/collision/proximity_analysis', routes.proximityAnalysis);

// Query 15: Retrieves weekly collisions for a specific borough and date range.
// Takes: `borough`, `start_date`, and `end_date` as query parameters.
app.get('/safety/weekly_collisions', routes.weeklyCollisions);

// =======================
// Start the server
// =======================
app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`);
});

module.exports = app;