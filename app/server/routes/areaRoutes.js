const connection = require('../db'); // Import the database connection

// Function to analyze areas where fares exceed the city-wide average
const fareAnalysis = async function (req, res) {
  try {
    const result = await connection.query(`
      WITH average_fare AS (
        SELECT AVG(fare_amount) AS city_avg
        FROM taxi
      )
      SELECT g.zone, g.borough, AVG(t.fare_amount) AS average_fare
      FROM taxi t
      JOIN geometry g ON t.pu_location_id = g.location_id
      GROUP BY g.zone, g.borough
      HAVING AVG(t.fare_amount) > (SELECT city_avg FROM average_fare)
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error analyzing fares:', err);
    res.status(500).send('Error analyzing fares');
  }
};

// Function to determine areas with longer average trip distances
const tripDistanceAnalysis = async function (req, res) {
  try {
    const result = await connection.query(`
      WITH average_distance AS (
        SELECT AVG(trip_distance) AS city_avg
        FROM taxi
      )
      SELECT g.zone, g.borough, AVG(t.trip_distance) AS average_distance
      FROM taxi t
      JOIN geometry g ON t.pu_location_id = g.location_id
      GROUP BY g.zone, g.borough
      HAVING AVG(t.trip_distance) > (SELECT city_avg FROM average_distance)
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error analyzing trip distances:', err);
    res.status(500).send('Error analyzing trip distances');
  }
};

// Function to find peak hours and locations for taxi activity
const peakHoursAnalysis = async function (req, res) {
  try {
    const result = await connection.query(`
      SELECT g.zone, g.borough, EXTRACT(HOUR FROM t.tpep_pickup_datetime) AS hour, COUNT(*) AS activity_count
      FROM taxi t
      JOIN geometry g ON t.pu_location_id = g.location_id
      GROUP BY g.zone, g.borough, hour
      ORDER BY activity_count DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error analyzing peak hours:', err);
    res.status(500).send('Error analyzing peak hours');
  }
};

// Function to locate pickup areas where more than X% of trips end in high-fare zones
const highFareTripsAnalysis = async function (req, res) {
  try {
    const percentage = req.query.percentage || 50;
    const result = await connection.query(`
      WITH high_fare_trips AS (
        SELECT pu_location_id, COUNT(*) AS count
        FROM taxi
        WHERE fare_amount > (
          SELECT PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY fare_amount)
          FROM taxi
        )
        GROUP BY pu_location_id
      ),
      total_trips AS (
        SELECT pu_location_id, COUNT(*) AS total
        FROM taxi
        GROUP BY pu_location_id
      )
      SELECT g.zone AS start_zone, g.borough, h.count, t.total,
             ROUND(h.count * 100.0 / t.total, 2) AS high_fare_pct
      FROM high_fare_trips h
      JOIN total_trips t ON h.pu_location_id = t.pu_location_id
      JOIN geometry g ON h.pu_location_id = g.location_id
      WHERE (h.count * 100.0 / t.total) > $1
      ORDER BY high_fare_pct DESC
    `, [percentage]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error analyzing high-fare trips:', err);
    res.status(500).send('Error analyzing high-fare trips');
  }
};

// Function to analyze locations that give more tips than X% of other locations
const tipAnalysis = async function (req, res) {
  try {
    const percentage = req.query.percentage || 50;
    const result = await connection.query(`
      SELECT g.zone, g.borough, AVG(t.tip_amount) AS average_tip
      FROM taxi t
      JOIN geometry g ON t.pu_location_id = g.location_id
      GROUP BY g.zone, g.borough
      HAVING AVG(t.tip_amount) > (
        SELECT PERCENTILE_CONT($1 / 100.0) WITHIN GROUP (ORDER BY tip_amount)
        FROM taxi
      )
    `, [percentage]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error analyzing tips:', err);
    res.status(500).send('Error analyzing tips');
  }
};

module.exports = {
  fareAnalysis,
  tripDistanceAnalysis,
  peakHoursAnalysis,
  highFareTripsAnalysis,
  tipAnalysis,
};


