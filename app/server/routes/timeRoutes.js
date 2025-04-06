const express = require('express');
const router = express.Router();
const connection = require('../db').connection;

// Function to analyze how safety (collisions) varies by season (Query 6)
async function safetyBySeason(req, res) {
  try {
    const result = await connection.query(`
      SELECT
        CASE
          WHEN EXTRACT(MONTH FROM crash_date) IN (12, 1, 2) THEN 'Winter'
          WHEN EXTRACT(MONTH FROM crash_date) IN (3, 4, 5) THEN 'Spring'
          WHEN EXTRACT(MONTH FROM crash_date) IN (6, 7, 8) THEN 'Summer'
          WHEN EXTRACT(MONTH FROM crash_date) IN (9, 10, 11) THEN 'Fall'
        END AS season,
        COUNT(*) AS collision_count
      FROM collision
      WHERE crash_date IS NOT NULL
      GROUP BY season
      ORDER BY collision_count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error analyzing safety by season:', error);
    res.status(500).json({ error: 'Failed to analyze safety by season' });
  }
}

// Function to compute the collision rate per 1,000 taxi rides at a location in a date range (Query 7)
async function collisionRate(req, res) {
  try {
    const { start_date, end_date, location_id } = req.query;
    const result = await connection.query(`
      WITH collisions_count AS (
        SELECT COUNT(*) AS collisions
        FROM collision c
        JOIN borough_lut b ON c.borough_id = b.borough_id
        JOIN nyc_geometry g ON g.borough_id = b.borough_id
        WHERE c.crash_date BETWEEN $1 AND $2
          AND g.location_id = $3
      ),
      taxi_count AS (
        SELECT COUNT(*) AS taxi_rides
        FROM taxi t
        JOIN nyc_geometry g ON t.pu_location_id = g.location_id OR t.do_location_id = g.location_id
        WHERE t.tpep_pickup_datetime BETWEEN $1 AND $2
          AND g.location_id = $3
      )
      SELECT (c.collisions * 1000.0 / NULLIF(t.taxi_rides, 0)) AS collision_rate
      FROM collisions_count c, taxi_count t
    `, [start_date, end_date, location_id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error computing collision rate:', error);
    res.status(500).json({ error: 'Failed to compute collision rate' });
  }
}

// Function to find same collision date-hours (Query 8)
async function sameCollisionDateHours(req, res) {
  try {
    const result = await connection.query(`
      SELECT
        DATE(crash_date) AS date,
        EXTRACT(HOUR FROM crash_time::time) AS hour,
        COUNT(*) AS collision_count
      FROM collision
      WHERE crash_date IS NOT NULL AND crash_time IS NOT NULL
      GROUP BY date, hour
      HAVING COUNT(*) > 1
      ORDER BY collision_count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error finding same collision date-hours:', error);
    res.status(500).json({ error: 'Failed to find same collision date-hours' });
  }
}

// Define routes
router.get('/safety-by-season', safetyBySeason);
router.get('/collision-rate', collisionRate);
router.get('/same-collision-date-hours', sameCollisionDateHours);

module.exports = router;


