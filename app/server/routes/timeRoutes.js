const connection = require('../db');

// Function to analyze how safety (collisions) varies by season (Query 7)
const safetyBySeason = async function (req, res) {
  const client = await connection.connect();
  try {
    const result = await client.query(`
      SELECT
        CASE
          WHEN EXTRACT(MONTH FROM crash_date) IN (12, 1, 2) THEN 'Winter'
          WHEN EXTRACT(MONTH FROM crash_date) IN (3, 4, 5) THEN 'Spring'
          WHEN EXTRACT(MONTH FROM crash_date) IN (6, 7, 8) THEN 'Summer'
          WHEN EXTRACT(MONTH FROM crash_date) IN (9, 10, 11) THEN 'Fall'
          ELSE 'Unknown'
        END AS season,
        COUNT(*) AS collision_count
      FROM collision
      WHERE crash_date IS NOT NULL
      GROUP BY season
      ORDER BY collision_count DESC;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error analyzing safety by season:', error);
    res.status(500).json({ error: 'Failed to analyze safety by season' });
  } finally {
    client.release();
  }
};

// Function to compute the collision rate per 1,000 taxi rides at a location in a date range (Query 8)
const collisionRate = async function (req, res) {
  const client = await connection.connect();
  try {
    const { start_date, end_date, location_id } = req.query;

    if (!start_date || !end_date || !location_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await client.query(`
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
      FROM collisions_count c, taxi_count t;
    `, [start_date, end_date, location_id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error computing collision rate:', error);
    res.status(500).json({ error: 'Failed to compute collision rate' });
  } finally {
    client.release();
  }
};

// Function to find same collision date-hours (Query 9)
const sameCollisionDateHours = async function (req, res) {
  const client = await connection.connect();
  try {
    const result = await client.query(`
      SELECT
        DATE(crash_date) AS date,
        EXTRACT(HOUR FROM crash_time::time) AS hour,
        COUNT(*) AS collision_count
      FROM collision
      WHERE crash_date IS NOT NULL AND crash_time IS NOT NULL
      GROUP BY date, hour
      HAVING COUNT(*) > 1
      ORDER BY collision_count DESC;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error finding same collision date-hours:', error);
    res.status(500).json({ error: 'Failed to find same collision date-hours' });
  } finally {
    client.release();
  }
};

// Function to list collisions in a given date range (Query 10)
const collisionsInDateRange = async function (req, res) {
  const client = await connection.connect();
  try {
    const { start_date, end_date } = req.query;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Missing start_date or end_date query parameter' });
    }

    const result = await client.query(`
      SELECT 
        collision_id,
        crash_date,
        borough_id,
        latitude,
        longitude,
        number_of_persons_injured,
        number_of_persons_killed
      FROM collision
      WHERE crash_date BETWEEN $1 AND $2
      ORDER BY crash_date ASC
      LIMIT $3 OFFSET $4;
    `, [start_date, end_date, limit, offset]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error retrieving collisions by date:', error);
    res.status(500).json({ error: 'Failed to retrieve collision data' });
  } finally {
    client.release();
  }
};

module.exports = {
  safetyBySeason,
  collisionRate,
  sameCollisionDateHours,
  collisionsInDateRange
};