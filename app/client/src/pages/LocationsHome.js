import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Link, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const config = require('../config.json');

export default function LocationInfoPage() {
  const { location_id } = useParams();

  const [locationData, setLocationData] = useState({});
  const [locationMetrics, setLocationMetrics] = useState([]);
  const [geometryData, setGeometryData] = useState([]);

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/nyc_geometry`)
    .then(res => res.json())
    .then(data => setGeometryData(data));
    // Fetch data for pickups and drop-offs
    fetch(`http://${config.server_host}:${config.server_port}/location/${location_id}/pickups_dropoffs`)
      .then(res => res.json())
      .then(data => setLocationMetrics(prev => [...prev, { title: 'Pickups & Drop-offs', data }]));

    // Fetch data for collisions and injuries
    fetch(`http://${config.server_host}:${config.server_port}/location/${location_id}/collisions_injuries`)
      .then(res => res.json())
      .then(data => setLocationMetrics(prev => [...prev, { title: 'Collisions & Injuries', data }]));

    // Fetch data for fare and trip distance
    fetch(`http://${config.server_host}:${config.server_port}/location/${location_id}/fare_trip_distance`)
      .then(res => res.json())
      .then(data => setLocationMetrics(prev => [...prev, { title: 'Fare & Trip Distance', data }]));

    // Fetch data for safety ranking
    fetch(`http://${config.server_host}:${config.server_port}/location/${location_id}/safety_ranking`)
      .then(res => res.json())
      .then(data => setLocationMetrics(prev => [...prev, { title: 'Safety Ranking', data }]));

    // Fetch valid locations
    fetch(`http://${config.server_host}:${config.server_port}/location/valid_locations`)
      .then(res => res.json())
      .then(data => setLocationData(data));
  }, [location_id]);

  return (
    <Container>
      <Stack direction="column" spacing={4}>
        <h1>Location Metrics</h1>
        {locationMetrics.map((metric, index) => (
          <div key={index}>
            <h2>{metric.title}</h2>
            <pre>{JSON.stringify(metric.data, null, 2)}</pre>
          </div>
        ))}
      </Stack>

      <h2>Valid Locations</h2>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Location ID</TableCell>
              <TableCell>Zone</TableCell>
              <TableCell>Borough</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {locationData.map((location) => (
              <TableRow key={location.location_id}>
                <TableCell>{location.location_id}</TableCell>
                <TableCell>{location.zone}</TableCell>
                <TableCell>{location.borough}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}