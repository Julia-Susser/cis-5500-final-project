const connection = require('../db'); // Import the database connection

// Function to analyze how safety varies by season
const safetyBySeason = async function (req, res) {
  try {
    const result = await connection.query(`
      SELECT season, COUNT(*) AS safety_count
      FROM SafetyData
      GROUP BY season
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error analyzing safety by season:', err);
    res.status(500).send('Error analyzing safety by season');
  }
};

// Function to compute the collision rate per 1,000 taxi rides
const collisionRate = async function (req, res) {
  try {
    const { start_date, end_date, location } = req.query;
    const result = await connection.query(`
      SELECT (COUNT(collisions) * 1000.0 / COUNT(taxi_rides)) AS collision_rate
      FROM CollisionData
      WHERE date BETWEEN $1 AND $2 AND location = $3
    `, [start_date, end_date, location]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error computing collision rate:', err);
    res.status(500).send('Error computing collision rate');
  }
};

// Function to identify accident spikes in high-density taxi areas
const accidentSpikes = async function (req, res) {
  try {
    const result = await connection.query(`
      SELECT month, COUNT(*) AS accident_count
      FROM AccidentData
      WHERE density = 'high'
      GROUP BY month
      HAVING COUNT(*) > 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error identifying accident spikes:', err);
    res.status(500).send('Error identifying accident spikes');
  }
};

// Function to find dates with the same number of collisions
const sameCollisionDates = async function (req, res) {
  try {
    const result = await connection.query(`
      SELECT date, COUNT(*) AS collision_count
      FROM CollisionData
      GROUP BY date
      HAVING COUNT(*) > 1
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error finding same collision dates:', err);
    res.status(500).send('Error finding same collision dates');
  }
};

module.exports = {
  safetyBySeason,
  collisionRate,
  accidentSpikes,
  sameCollisionDates,
};
