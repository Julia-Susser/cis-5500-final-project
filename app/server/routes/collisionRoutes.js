const connection = require('../db'); // Import the database connection

// Function to identify locations where the collision rate is higher than the city-wide median
const highCollisionRate = async function (req, res) {
  try {
    const result = await connection.query(`
      SELECT location, collision_rate
      FROM CollisionData
      WHERE collision_rate > (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY collision_rate) FROM CollisionData)
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
      SELECT borough, COUNT(*) AS collision_count
      FROM CollisionData
      WHERE date BETWEEN $1 AND $2
      GROUP BY borough
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
      SELECT location, COUNT(*) AS collision_count
      FROM CollisionData
      WHERE taxi_pickups < 10
      GROUP BY location
      ORDER BY collision_count DESC
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
