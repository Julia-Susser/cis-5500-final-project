const express = require('express');
const router = express.Router();
const connection = require('../db').connection;

// Function to find peak hours and locations for taxi activity (Query 9)
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

// Function to find trips with outlier tips (Query 10)
async function tipAnalysis(req, res) {
  try {
    const result = await connection.query(`
      WITH tip_stats AS (
        SELECT
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY tip_amount) AS q1,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY tip_amount) AS q3
        FROM taxi
      ),
      outlier_rides AS (
        SELECT
          t.trip_id,
          t.tpep_pickup_datetime,
          t.tpep_dropoff_datetime,
          t.fare_amount,
          t.tip_amount,
          g.zone,
          b.borough
        FROM taxi t
        JOIN nyc_geometry g ON t.pu_location_id = g.location_id
        JOIN borough_lut b ON g.borough_id = b.borough_id,
        tip_stats ts
        WHERE t.tip_amount < (ts.q1 - 1.5 * (ts.q3 - ts.q1))
           OR t.tip_amount > (ts.q3 + 1.5 * (ts.q3 - ts.q1))
      )
      SELECT *
      FROM outlier_rides
      ORDER BY tip_amount DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error analyzing tips:', error);
    res.status(500).json({ error: 'Failed to analyze tips' });
  }
}

// Function to find collision hotspots with very few taxi pickups (Query 11)
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

// Function to analyze collisions and taxi pickups within 5000 units of each other (Query 12)
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
router.get('/peak-hours-analysis', peakHoursAnalysis);
router.get('/tip-analysis', tipAnalysis);
router.get('/collision-hotspots', collisionHotspots);
router.get('/proximity-analysis', proximityAnalysis);

module.exports = router;


