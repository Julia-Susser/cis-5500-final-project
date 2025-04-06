const express = require('express');
const router = express.Router();
const connection = require('../db').connection;

// Function to analyze areas where fares exceed the city-wide average (Query 10)
async function fareAnalysis(req, res) {
  try {
    const result = await connection.query(`
      WITH average_fare AS (
        SELECT AVG(fare_amount) AS city_avg
        FROM taxi
      )
      SELECT g.zone, b.borough, AVG(t.fare_amount) AS average_fare
      FROM taxi t
      JOIN nyc_geometry g ON t.pu_location_id = g.location_id
      JOIN borough_lut b ON g.borough_id = b.borough_id
      GROUP BY g.zone, b.borough
      HAVING AVG(t.fare_amount) > (SELECT city_avg FROM average_fare)
      ORDER BY average_fare DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error analyzing fares:', error);
    res.status(500).json({ error: 'Failed to analyze fares' });
  }
}

// Function to determine areas with longer average trip distances (Query 11)
async function tripDistanceAnalysis(req, res) {
  try {
    const result = await connection.query(`
      WITH average_distance AS (
        SELECT AVG(trip_distance) AS city_avg
        FROM taxi
      )
      SELECT g.zone, b.borough, AVG(t.trip_distance) AS average_distance
      FROM taxi t
      JOIN nyc_geometry g ON t.pu_location_id = g.location_id
      JOIN borough_lut b ON g.borough_id = b.borough_id
      GROUP BY g.zone, b.borough
      HAVING AVG(t.trip_distance) > (SELECT city_avg FROM average_distance)
      ORDER BY average_distance DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error analyzing trip distances:', error);
    res.status(500).json({ error: 'Failed to analyze trip distances' });
  }
}

// Function to find peak hours and locations for taxi activity (Query 12)
async function peakHoursAnalysis(req, res) {
  try {
    const result = await connection.query(`
      SELECT g.zone, b.borough, EXTRACT(HOUR FROM t.tpep_pickup_datetime) AS hour, COUNT(*) AS activity_count
      FROM taxi t
      JOIN nyc_geometry g ON t.pu_location_id = g.location_id
      JOIN borough_lut b ON g.borough_id = b.borough_id
      GROUP BY g.zone, b.borough, hour
      ORDER BY activity_count DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error analyzing peak hours:', error);
    res.status(500).json({ error: 'Failed to analyze peak hours' });
  }
}

// Function to analyze locations that give more tips than X% of other locations (Query 14)
async function tipAnalysis(req, res) {
  try {
    const percentage = req.query.percentage || 50;
    const result = await connection.query(`
      SELECT g.zone, b.borough, AVG(t.tip_amount) AS average_tip
      FROM taxi t
      JOIN nyc_geometry g ON t.pu_location_id = g.location_id
      JOIN borough_lut b ON g.borough_id = b.borough_id
      GROUP BY g.zone, b.borough
      HAVING AVG(t.tip_amount) > (
        SELECT PERCENTILE_CONT($1 / 100.0) WITHIN GROUP (ORDER BY tip_amount)
        FROM taxi
      )
      ORDER BY average_tip DESC
    `, [percentage]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error analyzing tips:', error);
    res.status(500).json({ error: 'Failed to analyze tips' });
  }
}

// Find collision hotspots with very few taxi pickups (Query 17)
async function collisionHotspots(req, res) {
  try {
    const result = await connection.query(`
      WITH taxi_activity AS (
        SELECT g.location_id, COUNT(t.*) AS pickup_count
        FROM nyc_geometry g
        LEFT JOIN taxi t ON t.pu_location_id = g.location_id
        GROUP BY g.location_id
      )
      SELECT g.zone, b.borough, COUNT(c.*) AS collision_count, COALESCE(ta.pickup_count, 0) AS pickup_count
      FROM nyc_geometry g
      JOIN borough_lut b ON g.borough_id = b.borough_id
      LEFT JOIN collision c ON c.borough_id = g.borough_id
      LEFT JOIN taxi_activity ta ON g.location_id = ta.location_id
      GROUP BY g.zone, b.borough, ta.pickup_count
      HAVING COUNT(c.*) > 10 AND COALESCE(ta.pickup_count, 0) < 10
      ORDER BY collision_count DESC, pickup_count ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error finding collision hotspots:', error);
    res.status(500).json({ error: 'Failed to find collision hotspots' });
  }
}

// High Fare Trips Analysis - Find pickup areas where more than X% of trips end in high-fare zones (Query 13)
async function highFareTripsAnalysis(req, res) {
  try {
    const percentage = req.query.percentage || 50;
    const result = await connection.query(`
      WITH high_fare_trips AS (
        SELECT pu_location_id, COUNT(*) AS count
        FROM taxi
        WHERE fare_amount > (
          SELECT PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY fare_amount)
          FROM taxi
        )
        GROUP BY pu_location_id
      ),
      total_trips AS (
        SELECT pu_location_id, COUNT(*) AS total
        FROM taxi
        GROUP BY pu_location_id
      )
      SELECT g.zone AS start_zone, b.borough, h.count, t.total,
             ROUND(h.count * 100.0 / t.total, 2) AS high_fare_pct
      FROM high_fare_trips h
      JOIN total_trips t ON h.pu_location_id = t.pu_location_id
      JOIN nyc_geometry g ON h.pu_location_id = g.location_id
      JOIN borough_lut b ON g.borough_id = b.borough_id
      WHERE (h.count * 100.0 / t.total) > $1
      ORDER BY high_fare_pct DESC
    `, [percentage]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error analyzing high fare trips:', error);
    res.status(500).json({ error: 'Failed to analyze high fare trips' });
  }
}

// Function to analyze collisions and taxi pickups within 5000 units of each other (Query 26)
async function proximityAnalysis(req, res) {
  try {
    const result = await connection.query(`
      WITH collision_points AS (
        SELECT 
          c.collision_id,
          c.crash_date,
          ST_Transform(ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326), 2263) AS geom
        FROM collision c
        WHERE c.longitude IS NOT NULL AND c.latitude IS NOT NULL AND c.crash_date IS NOT NULL
      ),
      taxi_geom AS (
        SELECT 
          t.trip_id,
          t.trip_distance,
          t.tpep_pickup_datetime::date AS pickup_date,
          ST_Transform(g.geometry, 2263) AS pu_geom
        FROM taxi t
        JOIN nyc_geometry g ON t.pu_location_id = g.location_id
        WHERE t.tpep_pickup_datetime IS NOT NULL
      )
      SELECT 
        c.collision_id,
        COUNT(*) AS nearby_taxi_count
      FROM collision_points c
      JOIN taxi_geom t ON c.crash_date = t.pickup_date
      WHERE ST_DWithin(c.geom, t.pu_geom, 5000)
      GROUP BY c.collision_id
      LIMIT 3
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error analyzing collision and taxi proximity:', error);
    res.status(500).json({ error: 'Failed to analyze collision and taxi proximity' });
  }
}

// Define routes
router.get('/fare-analysis', fareAnalysis);
router.get('/trip-distance-analysis', tripDistanceAnalysis);
router.get('/peak-hours-analysis', peakHoursAnalysis);
router.get('/tip-analysis', tipAnalysis);
router.get('/collision-hotspots', collisionHotspots);
router.get('/high-fare-trips-analysis', highFareTripsAnalysis);
router.get('/proximity-analysis', proximityAnalysis);

module.exports = router;


