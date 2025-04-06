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
      WITH safety_metrics AS (
        SELECT 
          g.zone, 
          g.location_id, 
          b.borough,
          COUNT(c.*) AS collision_count,
          COALESCE(SUM(c.number_of_persons_injured), 0) AS total_injuries,
          COUNT(CASE WHEN t.pu_location_id = g.location_id THEN 1 END) AS pickup_count
        FROM nyc_geometry g
        JOIN borough_lut b ON g.borough_id = b.borough_id
        LEFT JOIN collision c ON c.borough_id = g.borough_id
        LEFT JOIN taxi t ON t.pu_location_id = g.location_id OR t.do_location_id = g.location_id
        GROUP BY g.zone, g.location_id, b.borough
      )
      SELECT 
        zone, 
        location_id, 
        borough,
        collision_count,
        total_injuries,
        pickup_count,
        RANK() OVER (ORDER BY collision_count DESC, total_injuries DESC) AS safety_rank,
        RANK() OVER (ORDER BY pickup_count DESC) AS availability_rank
      FROM safety_metrics
      ORDER BY safety_rank, availability_rank
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching safety ranking data:', error);
    res.status(500).json({ error: 'Failed to fetch safety ranking data' });
  }
}

// Define routes
router.get('/pickups-dropoffs', pickupsDropoffs);
router.get('/collisions-injuries', collisionsInjuries);
router.get('/fare-trip-distance', fareTripDistance);
router.get('/safety-ranking', safetyRanking);

module.exports = router;
