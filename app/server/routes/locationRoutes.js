const express = require('express');
const router = express.Router();
const connection = require('../db').connection;

// Get total taxi pickups and drop-offs (Query 1)
async function pickupsDropoffs(req, res) {
  try {
    const result = await connection.query(`
     SELECT
        g.zone,
        g.location_id,
        b.borough,
        COUNT(CASE WHEN t.pu_location_id = g.location_id THEN 1 END) AS pickup_count,
        COUNT(CASE WHEN t.do_location_id = g.location_id THEN 1 END) AS dropoff_count
      FROM nyc_geometry g
      JOIN borough_lut b ON g.borough_id = b.borough_id
      LEFT JOIN taxi t ON t.pu_location_id = g.location_id OR t.do_location_id = g.location_id
      GROUP BY g.zone, g.location_id, b.borough
      ORDER BY pickup_count DESC, dropoff_count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pickup/dropoff data:', error);
    res.status(500).json({ error: 'Failed to fetch pickup/dropoff data' });
  }
}

// Get number of collisions and injuries (Query 2)
async function collisionsInjuries(req, res) {
  try {
    const result = await connection.query(`
      SELECT
        g.zone,
        g.location_id,
        b.borough,
        COUNT(c.*) AS collision_count,
        COALESCE(SUM(c.number_of_persons_injured), 0) AS total_injuries
      FROM nyc_geometry g
      JOIN borough_lut b ON g.borough_id = b.borough_id
      LEFT JOIN collision c ON c.borough_id = g.borough_id
      GROUP BY g.zone, g.location_id, b.borough
      ORDER BY collision_count DESC, total_injuries DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching collision/injury data:', error);
    res.status(500).json({ error: 'Failed to fetch collision/injury data' });
  }
}

// Get average fare and trip distance (Query 3)
async function fareTripDistance(req, res) {
  try {
    const result = await connection.query(`
      SELECT
        g.zone,
        g.location_id,
        b.borough,
        AVG(t.fare_amount) AS avg_fare,
        AVG(t.trip_distance) AS avg_distance
      FROM nyc_geometry g
      JOIN borough_lut b ON g.borough_id = b.borough_id
      LEFT JOIN taxi t ON t.pu_location_id = g.location_id OR t.do_location_id = g.location_id
      GROUP BY g.zone, g.location_id, b.borough
      ORDER BY avg_fare DESC, avg_distance DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching fare/distance data:', error);
    res.status(500).json({ error: 'Failed to fetch fare/distance data' });
  }
}

// Get safety and taxi availability ranking (Query 4)
async function safetyRanking(req, res) {
  try {
    const result = await connection.query(`
      WITH safety AS (
        SELECT b.borough,
               b.borough_id,
               RANK() OVER (ORDER BY COUNT(*) + COALESCE(SUM(c.number_of_persons_injured), 0)) AS safety_rank
        FROM collision c
        JOIN borough_lut b ON c.borough_id = b.borough_id
        GROUP BY b.borough,b.borough_id
      ),
      taxi_activity AS (
        SELECT g.location_id,
               RANK() OVER (ORDER BY COUNT(*) DESC) AS taxi_availability_rank,
               g.borough_id
        FROM taxi t
        JOIN nyc_geometry g ON t.pu_location_id = g.location_id OR t.do_location_id = g.location_id
        GROUP BY g.location_id
      )
      SELECT s.borough,
             s.safety_rank,
             t.taxi_availability_rank,
             t.location_id
      FROM safety s
      JOIN taxi_activity t ON s.borough_id = t.borough_id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching safety ranking data:', error);
    res.status(500).json({ error: 'Failed to fetch safety ranking data' });
  }
}

// Get valid location IDs with taxi activity and collisions (Query 5)
async function validLocations(req, res) {
  try {
    const result = await connection.query(`
      WITH collision_boroughs AS (
        SELECT DISTINCT borough_id
        FROM collision
        WHERE crash_date BETWEEN '2024-01-01' AND '2024-12-31'
      ),
      taxi_zones AS (
        SELECT DISTINCT pu_location_id AS location_id
        FROM taxi
        WHERE tpep_pickup_datetime BETWEEN '2024-01-01' AND '2024-12-31'
        
        UNION
        
        SELECT DISTINCT do_location_id
        FROM taxi
        WHERE tpep_dropoff_datetime BETWEEN '2024-01-01' AND '2024-12-31'
      )
      SELECT DISTINCT g.zone, g.location_id, b.borough
      FROM nyc_geometry g
      JOIN borough_lut b ON g.borough_id = b.borough_id
      JOIN collision_boroughs cb ON g.borough_id = cb.borough_id
      JOIN taxi_zones tz ON g.location_id = tz.location_id
      ORDER BY g.zone
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching valid locations:', error);
    res.status(500).json({ error: 'Failed to fetch valid locations' });
  }
}

// Define routes
router.get('/pickups-dropoffs', pickupsDropoffs);
router.get('/collisions-injuries', collisionsInjuries);
router.get('/fare-trip-distance', fareTripDistance);
router.get('/safety-ranking', safetyRanking);
router.get('/valid-locations', validLocations);

module.exports = router;
