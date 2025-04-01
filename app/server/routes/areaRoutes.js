const connection = require('../db'); // Import the database connection

// Function to analyze areas where fares exceed the city-wide average
const fareAnalysis = async function (req, res) {
  try {
    const result = await connection.query(`
      SELECT area, AVG(fare) AS average_fare
      FROM TaxiData
      GROUP BY area
      HAVING AVG(fare) > (SELECT AVG(fare) FROM TaxiData)
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
      SELECT area, AVG(distance) AS average_distance
      FROM TaxiData
      GROUP BY area
      HAVING AVG(distance) > (SELECT AVG(distance) FROM TaxiData)
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
      SELECT area, hour, COUNT(*) AS activity_count
      FROM TaxiData
      GROUP BY area, hour
      ORDER BY activity_count DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error analyzing peak hours:', err);
    res.status(500).send('Error analyzing peak hours');
  }
};

// Function to locate starting areas where more than X% of trips end in high-fare zones
const highFareTripsAnalysis = async function (req, res) {
    try {
      const percentage = req.query.percentage || 50; // Fixed compatibility issue
      const result = await connection.query(`
        SELECT start_area, COUNT(*) AS trip_count
        FROM TaxiData
        WHERE end_fare_zone = 'high'
        GROUP BY start_area
        HAVING COUNT(*) * 100.0 / (SELECT COUNT(*) FROM TaxiData) > $1
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
      SELECT area, AVG(tip) AS average_tip
      FROM TaxiData
      GROUP BY area
      HAVING AVG(tip) > (SELECT PERCENTILE_CONT($1 / 100.0) WITHIN GROUP (ORDER BY tip) FROM TaxiData)
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
