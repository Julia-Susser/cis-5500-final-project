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
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const config = require('../config.json');

export default function TopStatsPage() {
  // State variables to store data for different sections
  const [tipOutliers, setTipOutliers] = useState([]); // Stores tip outlier rides
  const [collisionHotspots, setCollisionHotspots] = useState([]); // Stores collision hotspots
  const [proximityStats, setProximityStats] = useState([]); // Stores proximity analysis results
  const [date, setDate] = useState('2024-06-01'); // Date for proximity analysis
  const [factorDate, setFactorDate] = useState('2024-01-01'); // Date for contributing factor analysis
  const [selectedFactor, setSelectedFactor] = useState(''); // Selected contributing factor
  const [contributingFactors, setContributingFactors] = useState([]); // List of contributing factors
  const [factorLocations, setFactorLocations] = useState([]); // Locations with selected contributing factor

  // Fetch proximity analysis data based on the selected date
  const fetchProximity = () => {
    setProximityStats([]); // Clear previous results
    const url = `http://${config.server_host}:${config.server_port}/collision/proximity_analysis?date=${date}`;
    console.log(url);
    fetch(url)
      .then(res => res.json())
      .then(data => setProximityStats(Array.isArray(data) ? data : [])) // Update state with fetched data
      .catch(err => {
        console.error("Error fetching proximity data:", err);
        setProximityStats([]); // Reset state on error
      });
  };

  // Fetch initial data for tip outliers, collision hotspots, and contributing factors
  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/area/tip_analysis`)
      .then(res => res.json())
      .then(data => setTipOutliers(Array.isArray(data) ? data : [])); // Update tip outliers

    fetch(`http://${config.server_host}:${config.server_port}/area/collision_hotspots`)
      .then(res => res.json())
      .then(data => setCollisionHotspots(Array.isArray(data) ? data : [])); // Update collision hotspots

    fetch(`http://${config.server_host}:${config.server_port}/collision/contributing_factors`)
      .then(res => res.json())
      .then(data => setContributingFactors(Array.isArray(data) ? data : [])); // Update contributing factors
  }, []);

  // Fetch locations based on the selected contributing factor and date
  const fetchLocationsByFactor = () => {
    const url = `http://${config.server_host}:${config.server_port}/collision/location_with_factor?factor=${encodeURIComponent(selectedFactor)}&date=${factorDate}`;
    console.log(url);
    fetch(url)
      .then(res => res.json())
      .then(data => setFactorLocations(Array.isArray(data) ? data : [])) // Update state with fetched data
      .catch(err => {
        console.error("Error fetching locations by factor:", err);
        setFactorLocations([]); // Reset state on error
      });
  };

  return (
    <Container>
      {/* Page title */}
      <Typography variant="h4" gutterBottom>Top Stats</Typography>

      {/* Tip Outlier Rides Section */}
      <Typography variant="h5" gutterBottom>Tip Outlier Rides</Typography>
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
                <TableCell>${row.fare_amount}</TableCell>
                <TableCell>${row.tip_amount}</TableCell>
                <TableCell>{row.zone}</TableCell>
                <TableCell>{row.borough}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Collision Hotspots Section */}
      <Typography variant="h5" gutterBottom>Collision Hotspots with Few Pickups</Typography>
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

      {/* Proximity Analysis Section */}
      <Typography variant="h5" gutterBottom>Collisions Near Taxi Pickups (within 5km)</Typography>
      <Box display="flex" gap={2} alignItems="center" mb={2}>
        <TextField
          label="Pick a Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)} // Update date for proximity analysis
          inputProps={{ min: '2024-01-01', max: '2024-12-31' }}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={fetchProximity}>Search</Button> {/* Trigger proximity analysis */}
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
            {proximityStats.map((row, index) => (
              <TableRow key={row.collision_id || index}>
                <TableCell>{row.collision_id}</TableCell>
                <TableCell>{row.nearby_taxi_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Locations by Contributing Factor Section */}
      <Typography variant="h5" gutterBottom>Locations With Selected Contributing Factor</Typography>
      <Box display="flex" gap={2} alignItems="center" mb={2}>
        <FormControl style={{ minWidth: 200 }}>
          <InputLabel id="factor-select-label">Factor</InputLabel>
          <Select
            labelId="factor-select-label"
            value={selectedFactor}
            label="Factor"
            onChange={(e) => setSelectedFactor(e.target.value)} // Update selected factor
          >
            {contributingFactors.map((f, idx) => (
              <MenuItem key={idx} value={f}>{f}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Start Date"
          type="date"
          value={factorDate}
          onChange={(e) => setFactorDate(e.target.value)} // Update date for factor analysis
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={fetchLocationsByFactor}>Search</Button> {/* Trigger factor analysis */}
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Zone</TableCell>
              <TableCell>Borough</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {factorLocations.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.zone}</TableCell>
                <TableCell>{row.borough}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Spacer for layout */}
      <Box sx={{ height: '300px' }} />
    </Container>
  );
}