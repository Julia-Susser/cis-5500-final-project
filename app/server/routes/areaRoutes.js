const connection = require('../db');

// Function to find trips with outlier tips (Query 12)
const tipAnalysis = async function (req, res) {
  const client = await connection.connect();
  try {
    const result = await client.query(`
      SELECT
        t.trip_id,
        t.tpep_pickup_datetime,
        t.tpep_dropoff_datetime,
        t.fare_amount,
        t.tip_amount,
        g.zone,
        b.borough
      FROM taxi t
      JOIN nyc_geometry g ON t.pu_location_id = g.location_id
      JOIN borough_lut b ON g.borough_id = b.borough_id
      JOIN tip_percentiles ts ON TRUE
      WHERE t.tip_amount > ts.q
      ORDER BY t.tip_amount DESC
      LIMIT 10;
    `);
    console.log("QUERY: tip analysis");
    res.json(result.rows);
  } catch (error) {
    console.error('Error analyzing tips:', error);
    res.status(500).json({ error: 'Failed to analyze tips' });
  } finally {
    client.release();
  }
};


// Function to find collision hotspots with very few taxi pickups (Query 13)
const collisionHotspots = async function (req, res) {
  const client = await connection.connect();
  try {
    const result = await client.query(`
      SELECT
        g.zone,
        b.borough,
        COALESCE(ca.collision_count, 0) AS collision_count,
        COALESCE(ta.taxi_trips, 0) AS pickup_count
      FROM nyc_geometry g
      JOIN borough_lut b ON g.borough_id = b.borough_id
      LEFT JOIN taxi_pu_matview ta ON g.location_id = ta.location_id
      LEFT JOIN (
        SELECT location_id, COUNT(*) AS collision_count
        FROM collision
        GROUP BY location_id
      ) ca ON g.location_id = ca.location_id
      WHERE
        COALESCE(ca.collision_count, 0) > 10
        AND COALESCE(ta.taxi_trips, 0) < 10
      ORDER BY collision_count DESC, pickup_count ASC;
    `);
    console.log("QUERY: collision hotspot");
    res.json(result.rows);
  } catch (error) {
    console.error('Error finding collision hotspots:', error);
    res.status(500).json({ error: 'Failed to find collision hotspots' });
  } finally {
    client.release();
  }
};

// Function to analyze collisions and taxi pickups within 5000 units of each other (Query 14)
const proximityAnalysis = async function (req, res) {
  const client = await connection.connect();
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Missing required query parameter: date' });
    }

    const result = await client.query(`
     WITH nearby_taxi_locations AS (
  SELECT
    c.collision_id,
    c.crash_date,
    g.location_id
  FROM (
    SELECT collision_id, crash_date, geom
    FROM collision_points_mat
    WHERE crash_date = $1
  ) AS c
  JOIN nyc_geometry g
    ON ST_DWithin(c.geom, g.geometry, 5000)
)
SELECT
  ntl.collision_id,
  COUNT(*) AS nearby_taxi_count
FROM nearby_taxi_locations ntl
JOIN taxi_pickups_by_date_location t
  ON t.pu_location_id = ntl.location_id
  AND t.pickup_date = $1
GROUP BY ntl.collision_id
ORDER BY nearby_taxi_count DESC
LIMIT 10;
    `, [date]);
    console.log("QUERY: proximity");
    res.json(result.rows);
  } catch (error) {
    console.error('Error analyzing collision and taxi proximity:', error);
    res.status(500).json({ error: 'Failed to analyze collision and taxi proximity' });
  } finally {
    client.release();
  }
};

module.exports = {
  tipAnalysis,
  collisionHotspots,
  proximityAnalysis
};
