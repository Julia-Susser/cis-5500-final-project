const connection = require('../db'); // Import the database connection

// Function to retrieve general analytics for a specific location
const locationAnalytics = async function (req, res) {
  try {
    const locationId = req.params.location_id;
    const result = await connection.query(`
      SELECT *
      FROM LocationData
      WHERE location_id = $1
    `, [locationId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error retrieving location analytics:', err);
    res.status(500).send('Error retrieving location analytics');
  }
};

// Function to retrieve total taxi pickups and drop-offs in a given location
const pickupsDropoffs = async function (req, res) {
  try {
    const locationId = req.params.location_id;
    const result = await connection.query(`
      SELECT SUM(pickups) AS total_pickups, SUM(dropoffs) AS total_dropoffs
      FROM TaxiData
      WHERE location_id = $1
    `, [locationId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error retrieving pickups and drop-offs:', err);
    res.status(500).send('Error retrieving pickups and drop-offs');
  }
};

// Function to retrieve the number of collisions and injuries recorded in the area
const collisionsInjuries = async function (req, res) {
  try {
    const locationId = req.params.location_id;
    const result = await connection.query(`
      SELECT COUNT(*) AS collisions, SUM(injuries) AS total_injuries
      FROM CollisionData
      WHERE location_id = $1
    `, [locationId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error retrieving collisions and injuries:', err);
    res.status(500).send('Error retrieving collisions and injuries');
  }
};

// Function to retrieve the average fare and trip distance for rides in the location
const fareTripDistance = async function (req, res) {
  try {
    const locationId = req.params.location_id;
    const result = await connection.query(`
      SELECT AVG(fare) AS average_fare, AVG(distance) AS average_distance
      FROM TaxiData
      WHERE location_id = $1
    `, [locationId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error retrieving fare and trip distance:', err);
    res.status(500).send('Error retrieving fare and trip distance');
  }
};

// Function to retrieve the ranking of the area in terms of safety and taxi availability
const safetyRanking = async function (req, res) {
  try {
    const locationId = req.params.location_id;
    const result = await connection.query(`
      SELECT safety_rank, taxi_availability_rank
      FROM LocationRankings
      WHERE location_id = $1
    `, [locationId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error retrieving safety ranking:', err);
    res.status(500).send('Error retrieving safety ranking');
  }
};

module.exports = {
  locationAnalytics,
  pickupsDropoffs,
  collisionsInjuries,
  fareTripDistance,
  safetyRanking,
};
