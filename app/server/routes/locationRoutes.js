const connection = require('../db');

// Function to retrieve total taxi pickups and drop-offs in a given location
// Route: GET /location/:location_id/pickups_dropoffs
// Description: Retrieves the total number of taxi pickups and drop-offs for a specific location.
const pickupsDropoffs = async function (req, res) {
  const client = await connection.connect();
  try {
    const locationId = req.params.location_id;
    if (!locationId){
      return res.status(400).json({ error: 'Missing required query parameter: location id' });
    }
    const result = await client.query(`
     SELECT
  g.zone,
  b.borough,
  COALESCE(pu.taxi_trips, 0) AS total_pickups,
  COALESCE(dropo.taxi_trips, 0) AS total_dropoffs
FROM nyc_geometry g
JOIN borough_lut b ON g.borough_id = b.borough_id
LEFT JOIN taxi_pu_matview pu ON g.location_id = pu.location_id
LEFT JOIN taxi_do_matview dropo ON g.location_id = dropo.location_id
WHERE g.location_id = $1
GROUP BY g.zone, b.borough, pu.taxi_trips, dropo.taxi_trips;
    `, [locationId]);
    console.log("QUERY: pickup dropoffs");
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error retrieving pickups and drop-offs:', err);
    res.status(500).send('Error retrieving pickups and drop-offs');
  } finally {
    client.release();
  }
};

// Function to retrieve the number of collisions and injuries recorded in the area
// Route: GET /location/:location_id/collisions_injuries
// Description: Retrieves the number of collisions and total injuries for a specific location.
const collisionsInjuries = async function (req, res) {
  const client = await connection.connect();
  try {
    const locationId = req.params.location_id;
    if (!locationId){
      return res.status(400).json({ error: 'Missing required query parameter: location id' });
    }
    const result = await client.query(`
      SELECT g.zone, b.borough,
             COUNT(*) AS collisions,
             SUM(c.number_of_persons_injured) AS total_injuries
      FROM collision c
      JOIN borough_lut b ON c.borough_id = b.borough_id
      JOIN nyc_geometry g ON b.borough_id = g.borough_id
      WHERE g.location_id = $1
      GROUP BY b.borough, g.zone;
    `, [locationId]);
    console.log("QUERY: collision injuries");
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error retrieving collisions and injuries:', err);
    res.status(500).send('Error retrieving collisions and injuries');
  } finally {
    client.release();
  }
};


// Function to retrieve the ranking of the area in terms of safety and taxi availability
// Route: GET /location/:location_id/safety_ranking
// Description: Retrieves the safety ranking and taxi availability ranking for a specific location.
const safetyRanking = async function (req, res) {
  const client = await connection.connect();
  try {
    const locationId = req.params.location_id;
    if (!locationId){
      return res.status(400).json({ error: 'Missing required query parameter: location id' });
    }
    const result = await client.query(`
      WITH combined AS (
        SELECT
          s.location_id,
          s.zone,
          s.borough_id,
          s.safety_score,
          t.taxi_trips,
          RANK() OVER (ORDER BY s.safety_score) AS safety_rank,
          RANK() OVER (ORDER BY t.taxi_trips DESC) AS taxi_availability_rank
        FROM safety_scores_matview s
        JOIN taxi_pu_matview t ON s.location_id = t.location_id
      )
      SELECT zone, borough_id, safety_rank, taxi_availability_rank
      FROM combined
      WHERE location_id = $1;
    `, [locationId]);
    console.log("QUERY: safety ranking");
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error retrieving safety ranking:', err);
    res.status(500).send('Error retrieving safety ranking');
  } finally {
    client.release();
  }
};

// Function to retrieve NYC geometry data
// Route: GET /location/nyc_geometry
// Description: Retrieves NYC geometry data, including zones, boroughs, and geometry shapes.
const getNYCGeometry = async function (req, res) {
  const client = await connection.connect();
  try {
    const result = await client.query(`
      SELECT g.location_id, g.zone, b.borough, g.geometry_shp
      FROM nyc_geometry g
      JOIN borough_lut b ON g.borough_id = b.borough_id;
    `);
    console.log("QUERY: nyc geometry");
    res.json(result.rows);
  } catch (err) {
    console.error('Error retrieving NYC geometry data:', err);
    res.status(500).send('Error retrieving NYC geometry data');
  } finally {
    client.release();
  }
};

//function to parse shape into geometry so that easier to do proximity analysis
function parseWKTPolygon(wkt) {
  //different types of shapes so different formula for geometry
  if (wkt.startsWith('POLYGON')) {
    const coords = wkt
      .replace("POLYGON ((", "")
      .replace("))", "")
      .split(", ")
      .map(pair => pair.split(" ").map(Number))
      .map(([x, y]) => [(x * 0.00001 - 74.1), (y * 0.00001 + 40.5)]);

    return {
      type: "Polygon",
      coordinates: [coords]
    };
  }

  if (wkt.startsWith('MULTIPOLYGON')) {
    const polyStrings = wkt
      .replace("MULTIPOLYGON ((", "")
      .replace("))", "")
      .split(")", "(");

    const polygons = polyStrings.map(polygon => {
      const coords = polygon
        .split(", ")
        .map(pair => pair.split(" ").map(Number))
        .map(([x, y]) => [(x * 0.00001 - 74.1), (y * 0.00001 + 40.5)]);
      return [coords];
    });

    return {
      type: "MultiPolygon",
      coordinates: polygons
    };
  }
  return null;
}


// Function to retrieve NYC geometry map data
// Route: GET /location/nyc_geometry_map
// Description: Retrieves NYC geometry map data as GeoJSON for visualization.
const getNYCGeometryMap = async function (req, res) {
  const client = await connection.connect();
  try {
    const result = await client.query(`
      SELECT g.location_id, g.zone, b.borough, g.geometry_shp
      FROM nyc_geometry g
      JOIN borough_lut b ON g.borough_id = b.borough_id;
    `);

    const features = result.rows.map(item => ({
      type: "Feature",
      geometry: parseWKTPolygon(item.geometry_shp),
      properties: {
        location_id: item.location_id,
        zone: item.zone,
        borough: item.borough
      }
    }));

    res.json({
      type: "FeatureCollection",
      features
    });
  } catch (err) {
    console.error('Error retrieving NYC geometry map data:', err);
    res.status(500).send('Error retrieving NYC geometry map data');
  } finally {
    client.release();
  }
};



module.exports = {
  pickupsDropoffs,
  collisionsInjuries,
  safetyRanking,
  getNYCGeometry,
  getNYCGeometryMap,
};
