const connection = require('../db'); 


// Function to retrieve total taxi pickups and drop-offs in a given location
const pickupsDropoffs = async function (req, res) {
    try {
      const locationId = req.params.location_id;
      const result = await connection.query(`
        SELECT g.zone, g.borough,
               COUNT(CASE WHEN t.pu_location_id = g.location_id THEN 1 END) AS total_pickups,
               COUNT(CASE WHEN t.do_location_id = g.location_id THEN 1 END) AS total_dropoffs
        FROM geometry g
        LEFT JOIN taxi t ON t.pu_location_id = g.location_id OR t.do_location_id = g.location_id
        WHERE g.location_id = $1
        GROUP BY g.borough
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
        SELECT g.zone, g.borough,
               COUNT(*) AS collisions,
               SUM(c.number_of_persons_injured) AS total_injuries
        FROM collisions c
        JOIN borough_lut b ON c.borough_id = b.borough_id
        JOIN geometry g ON b.borough = g.borough
        WHERE g.location_id = $1
        GROUP BY g.borough
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
        SELECT g.zone, g.borough,
               AVG(t.fare_amount) AS average_fare,
               AVG(t.trip_distance) AS average_distance
        FROM taxi t
        JOIN geometry g ON t.pu_location_id = g.location_id OR t.do_location_id = g.location_id
        WHERE g.location_id = $1
        GROUP BY g.zone, g.borough
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
        WITH safety AS (
          SELECT g.location_id, g.zone, g.borough,
                 RANK() OVER (ORDER BY COUNT(*) + COALESCE(SUM(c.number_of_persons_injured), 0)) AS safety_rank
          FROM collisions c
          JOIN borough_lut b ON c.borough_id = b.borough_id
          JOIN geometry g ON g.borough = b.borough
          GROUP BY g.location_id, g.zone, g.borough
        ),
        taxi_activity AS (
          SELECT g.location_id,
                 RANK() OVER (ORDER BY COUNT(*) DESC) AS taxi_availability_rank
          FROM taxi t
          JOIN geometry g ON t.pu_location_id = g.location_id OR t.do_location_id = g.location_id
          GROUP BY g.location_id
        )
        SELECT s.zone, s.borough,
               s.safety_rank,
               t.taxi_availability_rank
        FROM safety s
        JOIN taxi_activity t ON s.location_id = t.location_id
        WHERE s.location_id = $1
      `, [locationId]);
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error retrieving safety ranking:', err);
      res.status(500).send('Error retrieving safety ranking');
    }
  };


const getNYCGeometry = async function (req, res) {
    try {
        const result = await connection.query(`
            SELECT location_id, zone, borough, latitude, longitude
            FROM nyc_geometry
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error retrieving NYC geometry data:', err);
        res.status(500).send('Error retrieving NYC geometry data');
    }
};
 
// Add the new handler to the module exports
module.exports = {
  pickupsDropoffs,
  collisionsInjuries,
  fareTripDistance,
  safetyRanking,
  getNYCGeometry
};
  