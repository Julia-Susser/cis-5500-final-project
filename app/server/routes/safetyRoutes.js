const connection = require('../db');

const weeklyCollisions = async function (req, res) {
    try {
        const { borough, start_date, end_date } = req.query;
        
        // Add validation
        if (!borough || !start_date || !end_date) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        console.log('Query params:', { borough, start_date, end_date });

        console.log('Connection status:', connection?._connected);

        const result = await connection.query(`
            SELECT 
                g.location_id,
                g.zone,
                COUNT(*) as collision_count
            FROM collision c
            JOIN borough_lut b ON c.borough_id = b.borough_id
            JOIN nyc_geometry g ON g.location_id = c.location_id
            WHERE b.borough = $1
                AND c.crash_date BETWEEN $2 AND $3
            GROUP BY g.location_id, g.zone
            ORDER BY collision_count DESC
        `, [borough, start_date, end_date]);

        console.log('Query results:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error analyzing collisions:', error);
        res.status(500).json({ error: 'Failed to analyze collisions' });
    }
};

module.exports = {
    weeklyCollisions
};