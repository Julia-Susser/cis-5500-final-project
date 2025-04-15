const connection = require('../db'); 


// Function to retrieve total taxi pickups and drop-offs in a given location
const pickupsDropoffs = async function (req, res) {
  const client = await connection.connect();
    try {
      const locationId = req.params.location_id;
      const result = await client.query(`
        SELECT g.zone, b.borough,
       COUNT(CASE WHEN t.pu_location_id = g.location_id THEN 1 END) AS total_pickups,
       COUNT(CASE WHEN t.do_location_id = g.location_id THEN 1 END) AS total_dropoffs
        FROM nyc_geometry g
        LEFT JOIN taxi t ON t.pu_location_id = g.location_id OR t.do_location_id = g.location_id
        JOIN borough_lut b ON g.borough_id = b.borough_id
        WHERE g.location_id = $1
        GROUP BY b.borough, g.zone
      `, [locationId]);
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error retrieving pickups and drop-offs:', err);
      res.status(500).send('Error retrieving pickups and drop-offs');
    } finally {
      client.release(); 
    }
};
  
// Function to retrieve the number of collisions and injuries recorded in the area
const collisionsInjuries = async function (req, res) {
  const client = await connection.connect();
    try {
      const locationId = req.params.location_id;
      const result = await client.query(`
        SELECT g.zone, b.borough,
               COUNT(*) AS collisions,
               SUM(c.number_of_persons_injured) AS total_injuries
        FROM collision c
        JOIN borough_lut b ON c.borough_id = b.borough_id
        JOIN nyc_geometry g ON b.borough_id = g.borough_id
        WHERE g.location_id = $1
        GROUP BY b.borough, g.zone
      `, [locationId]);
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error retrieving collisions and injuries:', err);
      res.status(500).send('Error retrieving collisions and injuries');
    } finally {
      client.release(); 
    }
};

// Function to retrieve the average fare and trip distance for rides in the location
const fareTripDistance = async function (req, res) {
  const client = await connection.connect();
    try {
      const locationId = req.params.location_id;
      const result = await client.query(`
        SELECT g.zone, b.borough,
        ROUND(AVG(t.fare_amount), 2) AS average_fare,
        ROUND(AVG(t.trip_distance), 2) AS average_distance
        FROM taxi t
        JOIN nyc_geometry g ON t.pu_location_id = g.location_id OR t.do_location_id = g.location_id
        JOIN borough_lut b ON g.borough_id = b.borough_id
        WHERE g.location_id = $1
        GROUP BY b.borough, g.zone
      `, [locationId]);
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error retrieving fare and trip distance:', err);
      res.status(500).send('Error retrieving fare and trip distance');
    } finally {
      client.release(); 
    }
};

// Function to retrieve the ranking of the area in terms of safety and taxi availability
const safetyRanking = async function (req, res) {
  const client = await connection.connect();
    try {
      const locationId = req.params.location_id;
      const result = await client.query(`
        WITH safety AS (
          SELECT g.location_id, g.zone, g.borough_id,
                 RANK() OVER (ORDER BY COUNT(*) + COALESCE(SUM(c.number_of_persons_injured), 0)) AS safety_rank
          FROM collision c
          JOIN borough_lut b ON c.borough_id = b.borough_id
          JOIN nyc_geometry g ON g.borough_id = b.borough_id
          GROUP BY g.location_id, g.zone, g.borough_id
        ),
        taxi_activity AS (
          SELECT g.location_id,
                 RANK() OVER (ORDER BY COUNT(*) DESC) AS taxi_availability_rank
          FROM taxi t
          JOIN nyc_geometry g ON t.pu_location_id = g.location_id OR t.do_location_id = g.location_id
          GROUP BY g.location_id
        )
        SELECT s.zone, s.borough_id,
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
    } finally {
      client.release(); 
    }
};


// Get valid location IDs with taxi activity and collisions (Query 5)
const validLocations = async function (req, res)  {
  const client = await connection.connect();
  try {
    const result = await client.query(`
      WITH collision_boroughs AS (
        SELECT DISTINCT borough_id
        FROM collision
        WHERE crash_date BETWEEN '2024-01-01' AND '2024-12-31'
      ),
      taxi_zones AS (
        SELECT DISTINCT pu_location_id AS location_id
        FROM taxi
        WHERE tpep_pickup_datetime BETWEEN '2024-01-01' AND '2024-12-31'
        
        UNION
        
        SELECT DISTINCT do_location_id
        FROM taxi
        WHERE tpep_dropoff_datetime BETWEEN '2024-01-01' AND '2024-12-31'
      )
      SELECT DISTINCT g.zone, g.location_id, b.borough
      FROM nyc_geometry g
      JOIN borough_lut b ON g.borough_id = b.borough_id
      JOIN collision_boroughs cb ON g.borough_id = cb.borough_id
      JOIN taxi_zones tz ON g.location_id = tz.location_id
      ORDER BY g.zone
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching valid locations:', error);
    res.status(500).json({ error: 'Failed to fetch valid locations' });
  } finally {
    client.release(); 
  }

}
 
const getNYCGeometry = async function (req, res) {
  const client = await connection.connect();
    try {
        const result = await client.query(`
            SELECT g.location_id, g.zone, b.borough, g.geometry_shp
            FROM nyc_geometry g
            JOIN borough_lut b ON g.borough_id = b.borough_id
        `);
        console.log("sending geometry")
        res.json(result.rows);
    } catch (err) {
        console.error('Error retrieving NYC geometry data:', err);
        res.status(500).send('Error retrieving NYC geometry data');
    }finally {
      client.release(); 
    }
};


function parseWKTPolygon(wkt) {
  if (wkt.startsWith('POLYGON')) {
    const coords = wkt
      .replace("POLYGON ((", "")
      .replace("))", "")
      .split(", ")
      .map(pair => pair.split(" ").map(Number))
      .map(([x, y]) => {
        const lon = x * 0.00001 - 74.1;
        const lat = y * 0.00001 + 40.5;
        return [lon, lat];
      });

    return {
      type: "Polygon",
      coordinates: [coords]
    };
  }

  if (wkt.startsWith('MULTIPOLYGON')) {
    const polyStrings = wkt
      .replace("MULTIPOLYGON (((", "")
      .replace(")))", "")
      .split(")), ((");

    const polygons = polyStrings.map(polygon => {
      const coords = polygon
        .split(", ")
        .map(pair => pair.split(" ").map(Number))
        .map(([x, y]) => {
          const lon = x * 0.00001 - 74.1;
          const lat = y * 0.00001 + 40.5;
          return [lon, lat];
        });

      return [coords];
    });

    return {
      type: "MultiPolygon",
      coordinates: polygons
    };
  } 
  return null;
}

const getNYCGeometryMap = async function (req, res) {
  const client = await connection.connect();
  try {
    const result = await client.query(`
      SELECT g.location_id, g.zone, b.borough, g.geometry_shp
      FROM nyc_geometry g
      JOIN borough_lut b ON g.borough_id = b.borough_id
    `);

    const features = result.rows.map((item) => ({
      type: "Feature",
      geometry: parseWKTPolygon(item.geometry_shp),
      properties: {
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


// Add the new handler to the module exports
module.exports = {
  pickupsDropoffs,
  collisionsInjuries,
  fareTripDistance,
  validLocations,
  safetyRanking,
  getNYCGeometry,
  getNYCGeometryMap
};
  