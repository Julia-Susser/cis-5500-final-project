const connection = require('../db'); // Import the database connection

// Function to analyze how safety (collisions) varies by season
const safetyBySeason = async function (req, res) {
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
  } catch (err) {
    console.error('Error analyzing safety by season:', err);
    res.status(500).send('Error analyzing safety by season');
  }
};

// Function to compute the collision rate per 1,000 taxi rides at a location in a date range
const collisionRate = async function (req, res) {
  try {
    const { start_date, end_date, location_id } = req.query;
    const result = await connection.query(`
      WITH collisions_count AS (
        SELECT COUNT(*) AS collisions
        FROM collision c
        JOIN borough_lut b ON c.borough_id = b.borough_id
        JOIN geometry g ON g.borough = b.borough
        WHERE c.crash_date BETWEEN $1 AND $2
          AND g.location_id = $3
      ),
      taxi_count AS (
        SELECT COUNT(*) AS taxi_rides
        FROM taxi t
        JOIN geometry g ON t.pu_location_id = g.location_id OR t.do_location_id = g.location_id
        WHERE t.tpep_pickup_datetime BETWEEN $1 AND $2
          AND g.location_id = $3
      )
      SELECT (c.collisions * 1000.0 / NULLIF(t.taxi_rides, 0)) AS collision_rate
      FROM collisions_count c, taxi_count t
    `, [start_date, end_date, location_id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error computing collision rate:', err);
    res.status(500).send('Error computing collision rate');
  }
};

// Function to identify accident spikes in areas with high pickup density
const accidentSpikes = async function (req, res) {
  try {
    const result = await connection.query(`
      WITH pickup_density AS (
        SELECT pu_location_id, COUNT(*) AS pickups
        FROM taxi
        GROUP BY pu_location_id
        HAVING COUNT(*) > 1000
      )
      SELECT DATE_TRUNC('month', c.crash_date) AS month, COUNT(*) AS accident_count
      FROM collisions c
      JOIN borough_lut b ON c.borough_id = b.borough_id
      JOIN geometry g ON b.borough = g.borough
      JOIN pickup_density pd ON g.location_id = pd.pu_location_id
      GROUP BY month
      HAVING COUNT(*) > 100
      ORDER BY month
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error identifying accident spikes:', err);
    res.status(500).send('Error identifying accident spikes');
  }
};

const sameCollisionDateHours = async function (req, res) {
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
    } catch (err) {
      console.error('Error finding same collision date-hours:', err);
      res.status(500).send('Error finding same collision date-hours');
    }
  };
  

module.exports = {
  safetyBySeason,
  collisionRate,
  accidentSpikes,
  sameCollisionDates,
};


