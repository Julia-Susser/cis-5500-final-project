const express = require('express');
const cors = require('cors');
const config = require('./config');
const locationRoutes = require('./routes/locationRoutes');
const timeRoutes = require('./routes/timeRoutes');
const areaRoutes = require('./routes/areaRoutes');

const app = express();
app.use(cors({
  origin: '*',
}));

// =======================
// NYC Taxi Location Routes (Queries 1–5)
// =======================

// Query 1: Retrieves total taxi pickups and drop-offs in a given location.
// Takes: `location_id` as a URL parameter.
app.get('/location/:location_id/pickups_dropoffs', locationRoutes.pickupsDropoffs);

// Query 2: Retrieves the number of collisions and injuries recorded in the area.
// Takes: `location_id` as a URL parameter.
app.get('/location/:location_id/collisions_injuries', locationRoutes.collisionsInjuries);

// Query 3: Retrieves the average fare and trip distance for rides in the location.
// Takes: `location_id` as a URL parameter.
app.get('/location/:location_id/fare_trip_distance', locationRoutes.fareTripDistance);

// Query 4: Retrieves the ranking of the area in terms of safety and taxi availability.
// Takes: `location_id` as a URL parameter.
app.get('/location/:location_id/safety_ranking', locationRoutes.safetyRanking);

// Query 5: Retrieves zones with both taxi activity and collisions in a date range.
// Takes: No parameters.
app.get('/location/valid_locations', locationRoutes.validLocations);

// Query: get nyc geometry
// Takes: No parameters.
app.get('/location/nyc_geometry', locationRoutes.validLocations);

// =======================
// Time-Based Safety & Collision Routes (Queries 6–9)
// =======================

// Query 6: Analyzes how safety varies by season (e.g., winter vs. summer).
// Takes: No parameters.
app.get('/time/safety_by_season', timeRoutes.safetyBySeason);

// Query 7: Computes collision rate per 1,000 taxi rides at a location in a date range.
// Takes: `start_date`, `end_date`, and `location_id` as query parameters.
app.get('/time/collision_rate', timeRoutes.collisionRate);

// Query 9: Finds hours with repeated collisions on the same date.
// Takes: No parameters.
app.get('/time/same_collision_date_hours', timeRoutes.sameCollisionDateHours);

// =======================
// Area-Based Analytics (Queries 10–13)
// =======================

// Query 10: Finds peak hours and most active pickup locations.
// Takes: No parameters.
app.get('/area/peak_hours', areaRoutes.peakHoursAnalysis);

// Query 11: Analyzes locations with tip averages above certain thresholds.
// Takes: No parameters.
app.get('/area/tip_analysis', areaRoutes.tipAnalysis);

// Query 12: Identifies collision hotspots with very few taxi pickups.
// Takes: No parameters.
app.get('/area/collision_hotspots', areaRoutes.collisionHotspots);

// Query 13: Analyzes proximity of collisions to taxi pickups (within 5000 meters).
// Takes: No parameters.
app.get('/collision/proximity_analysis', areaRoutes.proximityAnalysis);

// Query 14: Retrieves collisions involving a specific street name.
// Takes: `street_name` as a URL parameter.
app.get('/collision/on_street/:street_name', areaRoutes.collisionsOnStreet);

// =======================
// Start the server
// =======================
app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`);
});

module.exports = app;