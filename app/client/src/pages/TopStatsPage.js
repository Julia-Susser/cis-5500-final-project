import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Box,
  Button
} from '@mui/material';

const config = require('../config.json');

export default function TopStatsPage() {
  const [tipOutliers, setTipOutliers] = useState([]);
  const [collisionHotspots, setCollisionHotspots] = useState([]);
  const [proximityStats, setProximityStats] = useState([]);
  const [date, setDate] = useState('2024-06-01');

  const fetchProximity = () => {
    const url = `http://${config.server_host}:${config.server_port}/collision/proximity_analysis?date=${date}`;
    fetch(url)
      .then(res => res.json())
      .then(data => setProximityStats(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Error fetching proximity data:", err);
        setProximityStats([]);
      });
  };

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/area/tip_analysis`)
      .then(res => res.json())
      .then(data => setTipOutliers(Array.isArray(data) ? data : []));

    fetch(`http://${config.server_host}:${config.server_port}/area/collision_hotspots`)
      .then(res => res.json())
      .then(data => setCollisionHotspots(Array.isArray(data) ? data : []));
  }, []);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Top Stats</Typography>

      {/* Tip Outlier Rides */}
      <Typography variant="h5" gutterBottom>💸 Tip Outlier Rides</Typography>
      <TableContainer component={Paper} sx={{ mb: 5 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Trip ID</TableCell>
              <TableCell>Pickup</TableCell>
              <TableCell>Dropoff</TableCell>
              <TableCell>Fare</TableCell>
              <TableCell>Tip</TableCell>
              <TableCell>Zone</TableCell>
              <TableCell>Borough</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tipOutliers.map(row => (
              <TableRow key={row.trip_id}>
                <TableCell>{row.trip_id}</TableCell>
                <TableCell>{row.tpep_pickup_datetime}</TableCell>
                <TableCell>{row.tpep_dropoff_datetime}</TableCell>
                <TableCell>${row.fare_amount?.toFixed(2)}</TableCell>
                <TableCell>${row.tip_amount?.toFixed(2)}</TableCell>
                <TableCell>{row.zone}</TableCell>
                <TableCell>{row.borough}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Collision Hotspots */}
      <Typography variant="h5" gutterBottom>🚨 Collision Hotspots with Few Pickups</Typography>
      <TableContainer component={Paper} sx={{ mb: 5 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Zone</TableCell>
              <TableCell>Borough</TableCell>
              <TableCell>Collision Count</TableCell>
              <TableCell>Pickup Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {collisionHotspots.map(row => (
              <TableRow key={`${row.zone}-${row.borough}`}>
                <TableCell>{row.zone}</TableCell>
                <TableCell>{row.borough}</TableCell>
                <TableCell>{row.collision_count}</TableCell>
                <TableCell>{row.pickup_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Proximity Analysis by Date */}
      <Typography variant="h5" gutterBottom>📍 Collisions Near Taxi Pickups (within 5km)</Typography>
      <Box display="flex" gap={2} alignItems="center" mb={2}>
        <TextField
          label="Pick a Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          inputProps={{ min: '2024-01-01', max: '2024-12-31' }}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={fetchProximity}>
          Search
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Collision ID</TableCell>
              <TableCell>Nearby Taxi Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proximityStats.map(row => (
              <TableRow key={row.collision_id}>
                <TableCell>{row.collision_id}</TableCell>
                <TableCell>{row.nearby_taxi_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
