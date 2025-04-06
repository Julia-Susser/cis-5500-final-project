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
app.get('/location/:location_id/pickups_dropoffs', routes.pickupsDropoffs);

// Query 2: Retrieves the number of collisions and injuries recorded in the area.
app.get('/location/:location_id/collisions_injuries', routes.collisionsInjuries);

// Query 3: Retrieves the average fare and trip distance for rides in the location.
app.get('/location/:location_id/fare_trip_distance', routes.fareTripDistance);

// Query 4: Retrieves the ranking of the area in terms of safety and taxi availability.
app.get('/location/:location_id/safety_ranking', routes.safetyRanking);

// Query 5: Retrieves zones with both taxi activity and collisions in a date range.
app.get('/location/valid_locations', routes.validLocations);

// =======================
// Time-Based Safety & Collision Routes (Queries 6–9)
// =======================

// Query 6: Analyzes how safety varies by season (e.g., winter vs. summer).
app.get('/time/safety_by_season', routes.safetyBySeason);

// Query 7: Computes collision rate per 1,000 taxi rides at a location in a date range.
app.get('/time/collision_rate', routes.collisionRate);

// Query 8: Identifies accident spikes in areas with high pickup density.
app.get('/time/accident_spikes', routes.accidentSpikes);

// Query 9: Finds hours with repeated collisions on the same date.
app.get('/time/same_collision_date_hours', routes.sameCollisionDateHours);

// =======================
// Area-Based Analytics (Queries 10–12)
// =======================

// Query 10: Finds peak hours and most active pickup locations.
app.get('/area/peak_hours', routes.peakHoursAnalysis);

// Query 11: Analyzes locations with tip averages above certain thresholds.
app.get('/area/tip_analysis', routes.tipAnalysis);

// Query 12: Identifies collision hotspots with very few taxi pickups.
app.get('/area/collision_hotspots', routes.collisionHotspots);

// Query 13: Analyzes proximity of collisions to taxi pickups (within 5000 meters).
app.get('/collision/proximity_analysis', routes.proximityAnalysis);

// =======================
// Start the server
// =======================
app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`);
});

module.exports = app;
