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
  Paper
} from '@mui/material';

const config = require('../config.json');

export default function TopStatsPage() {
  const [tipOutliers, setTipOutliers] = useState([]);
  const [collisionHotspots, setCollisionHotspots] = useState([]);
  const [proximityStats, setProximityStats] = useState([]);

  useEffect(() => {
    const tipUrl = `http://${config.server_host}:${config.server_port}/area/tip_analysis`;
    console.log("Fetching Tip Analysis from:", tipUrl);
    fetch(tipUrl)
      .then(res => res.json())
      .then(resJson => Array.isArray(resJson) ? setTipOutliers(resJson) : setTipOutliers([]))
      .catch(err => {
        console.error("Tip Analysis Error:", err);
        setTipOutliers([]);
      });

    const hotspotsUrl = `http://${config.server_host}:${config.server_port}/area/collision_hotspots`;
    console.log("Fetching Collision Hotspots from:", hotspotsUrl);
    fetch(hotspotsUrl)
      .then(res => res.json())
      .then(resJson => Array.isArray(resJson) ? setCollisionHotspots(resJson) : setCollisionHotspots([]))
      .catch(err => {
        console.error("Collision Hotspots Error:", err);
        setCollisionHotspots([]);
      });

    const proximityUrl = `http://${config.server_host}:${config.server_port}/collision/proximity_analysis`;
    console.log("Fetching Collision Proximity Analysis from:", proximityUrl);
    fetch(proximityUrl)
      .then(res => res.json())
      .then(resJson => Array.isArray(resJson) ? setProximityStats(resJson) : setProximityStats([]))
      .catch(err => {
        console.error("Proximity Analysis Error:", err);
        setProximityStats([]);
      });
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

      {/* Collision Proximity Analysis */}
      <Typography variant="h5" gutterBottom>📍 Collisions Near Taxi Pickups (within 5km)</Typography>
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
