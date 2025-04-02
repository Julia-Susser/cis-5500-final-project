const connection = require('../db'); // Import the database connection

// Function to identify locations where the collision rate is higher than the city-wide median
const highCollisionRate = async function (req, res) {
  try {
    const result = await connection.query(`
      WITH collisions_per_location AS (
        SELECT g.location_id, g.zone, g.borough, COUNT(*)::numeric AS collision_count
        FROM collision c
        JOIN borough_lut b ON c.borough_id = b.borough_id
        JOIN geometry g ON g.borough = b.borough
        GROUP BY g.location_id, g.zone, g.borough
      ),
      median_rate AS (
        SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY collision_count) AS median_collision_rate
        FROM collisions_per_location
      )
      SELECT cpl.zone, cpl.borough, cpl.collision_count
      FROM collisions_per_location cpl, median_rate
      WHERE cpl.collision_count > median_rate.median_collision_rate
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error analyzing high collision rates:', err);
    res.status(500).send('Error analyzing high collision rates');
  }
};

// Function to compare collisions across boroughs
const boroughCollisionComparison = async function (req, res) {
  try {
    const { start_date, end_date } = req.query;
    const result = await connection.query(`
      SELECT b.borough, COUNT(*) AS collision_count
      FROM collision c
      JOIN borough_lut b ON c.borough_id = b.borough_id
      WHERE crash_date BETWEEN $1 AND $2
      GROUP BY b.borough
      ORDER BY collision_count DESC
    `, [start_date, end_date]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error comparing collisions across boroughs:', err);
    res.status(500).send('Error comparing collisions across boroughs');
  }
};

// Function to locate collision hotspots with very few taxi pickups
const collisionHotspots = async function (req, res) {
  try {
    const result = await connection.query(`
      WITH collisions_per_location AS (
        SELECT g.location_id, g.zone, g.borough, COUNT(*) AS collision_count
        FROM collision c
        JOIN borough_lut b ON c.borough_id = b.borough_id
        JOIN geometry g ON g.borough = b.borough
        GROUP BY g.location_id, g.zone, g.borough
      ),
      pickups_per_location AS (
        SELECT g.location_id, COUNT(*) AS taxi_pickups
        FROM taxi t
        JOIN geometry g ON t.pu_location_id = g.location_id
        GROUP BY g.location_id
      )
      SELECT c.zone, c.borough, c.collision_count
      FROM collisions_per_location c
      LEFT JOIN pickups_per_location p ON c.location_id = p.location_id
      WHERE COALESCE(p.taxi_pickups, 0) < 10
      ORDER BY c.collision_count DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error identifying collision hotspots:', err);
    res.status(500).send('Error identifying collision hotspots');
  }
};

module.exports = {
  highCollisionRate,
  boroughCollisionComparison,
  collisionHotspots,
};

