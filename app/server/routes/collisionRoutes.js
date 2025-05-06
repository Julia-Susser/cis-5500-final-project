const connection = require('../db');




// Function to retrieve distinct contributing factors for collisions
// Route: GET /collision/contributing_factors
// Description: Retrieves a list of distinct contributing factors for collisions.
const collisionContributingFactors = async function (req, res) {
  const client = await connection.connect();
  try {
    const query = `SELECT DISTINCT f.contributing_factor_vehicle_1
      FROM contributing_factor_lut f
      WHERE f.contributing_factor_vehicle_1 IS NOT NULL
      ORDER BY f.contributing_factor_vehicle_1;`;
    const { rows } = await client.query(query);
    res.json(rows.map(r => r.contributing_factor_vehicle_1));
  } catch (err) {
    console.error('Error fetching contributing factors:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to retrieve locations with a specific contributing factor on a given date
// Route: GET /collision/location_with_factor
// Description: Retrieves locations where a specific contributing factor caused collisions on a given date.
const collisionFactorsByLocation = async function (req, res) {
  const { date, factor } = req.query;
  const client = await connection.connect();
  if (!date || !factor) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const query = `
      SELECT g.location_id, g.zone, b.borough
      FROM nyc_geometry g
      JOIN borough_lut b ON g.borough_id = b.borough_id
      WHERE EXISTS (
        SELECT 1
        FROM collision c
        JOIN contributing_factor_lut f ON c.contributing_factor_vehicle_1_id = f.contributing_factor_id
        WHERE c.location_id = g.location_id
          AND c.crash_date = $1
          AND f.contributing_factor_vehicle_1 = $2
      );
    `;
    const values = [date, factor];

    const { rows } = await client.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching locations by contributing factor:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports = {
  collisionContributingFactors,
  collisionFactorsByLocation 
};

