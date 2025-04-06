const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));

// NYC Taxi Location PUID Analytics (Map)
// Retrieves total taxi pickups and drop-offs in a given location.
app.get('/location/:location_id/pickups_dropoffs', routes.pickupsDropoffs);
// Retrieves the number of collisions and injuries recorded in the area.
app.get('/location/:location_id/collisions_injuries', routes.collisionsInjuries);
// Retrieves the average fare and trip distance for rides in the location.
app.get('/location/:location_id/fare_trip_distance', routes.fareTripDistance);
// Retrieves the ranking of the area in terms of safety and taxi availability.
app.get('/location/:location_id/safety_ranking', routes.safetyRanking);

// Search Page: Taxi Trip Analysis based on area
// Analyzes areas where fares exceed the city-wide average for similar trip distances.
app.get('/area/fare_analysis', routes.fareAnalysis);
// Determines areas with longer average trip distances than the city-wide average.
app.get('/area/trip_distance', routes.tripDistanceAnalysis);
// Finds peak hours and locations for taxi activity and collisions in a specific area.
app.get('/area/peak_hours', routes.peakHoursAnalysis);
// Locates starting areas where more than X% of trips end in high-fare zones.
app.get('/area/high_fare_trips', routes.highFareTripsAnalysis);
// Analyzes locations that give more tips than X% of other locations.
app.get('/area/tip_analysis', routes.tipAnalysis);
// Locates collision hotspots with very few taxi pickups, making them risky for pedestrians.
app.get('/area/collision_hotspots', routes.collisionHotspots);

// Search Page: Time-Based Collision & Safety Data
// Analyzes how safety varies by season (e.g., winter vs. summer).
app.get('/time/safety_by_season', routes.safetyBySeason);

// Search Page: Collision analysis based on area
// Analyzes collisions and taxi pickups within 5000 units of each other.
app.get('/collision/proximity_analysis', routes.proximityAnalysis);

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
