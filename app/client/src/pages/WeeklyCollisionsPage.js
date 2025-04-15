import { useEffect, useState } from 'react';
import { Container, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import HeatmapLayer from 'react-leaflet-heatmap-layer';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const config = require('../../config.json');

export default function WeeklyCollisionsPage() {
  const [boroughs, setBoroughs] = useState([]);
  const [selectedBorough, setSelectedBorough] = useState('');
  const [geometryData, setGeometryData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  useEffect(() => {
    // Fetch borough geometries
    fetch(`http://${config.server_host}:${config.server_port}/location/nyc_geometry`)
      .then(res => res.json())
      .then(data => {
        setGeometryData(data);
        const uniqueBoroughs = [...new Set(data.map(item => item.borough))];
        setBoroughs(uniqueBoroughs);
      });
  }, []);

  useEffect(() => {
    if (selectedBorough && selectedWeek) {
      // Fetch collision data for the selected borough and week
      const startDate = new Date(selectedWeek);
      const endDate = new Date(selectedWeek);
      endDate.setDate(startDate.getDate() + 6); // Add 6 days to get the week range

      fetch(`http://${config.server_host}:${config.server_port}/time/same_collision_date_hours?borough=${selectedBorough}&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`)
        .then(res => res.json())
        .then(data => {
          const heatmapPoints = data.map(collision => [
            collision.latitude,
            collision.longitude,
            1, // Intensity of the heatmap point
          ]);
          setHeatmapData(heatmapPoints);
        });
    }
  }, [selectedBorough, selectedWeek]);

  const handleBoroughChange = (event) => {
    setSelectedBorough(event.target.value);
  };

  const handleWeekChange = (date) => {
    setSelectedWeek(date);
  };

  const boroughGeometry = geometryData.filter(item => item.borough === selectedBorough);

  return (
    <Container>
      <h1>Weekly Collisions in NYC</h1>
      <FormControl fullWidth>
        <InputLabel>Borough</InputLabel>
        <Select value={selectedBorough} onChange={handleBoroughChange}>
          {boroughs.map(borough => (
            <MenuItem key={borough} value={borough}>
              {borough}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <DatePicker
        selected={selectedWeek}
        onChange={handleWeekChange}
        dateFormat="yyyy-MM-dd"
        showWeekNumbers
      />
      <MapContainer
        center={[40.7128, -74.0060]} // Default center (NYC)
        zoom={11}
        style={{ height: '500px', width: '100%', marginTop: '20px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {boroughGeometry.map((geo, idx) => (
          <GeoJSON key={idx} data={geo.geometry} style={{ color: '#3388ff' }} />
        ))}
        <HeatmapLayer
          points={heatmapData}
          longitudeExtractor={m => m[1]}
          latitudeExtractor={m => m[0]}
          intensityExtractor={m => m[2]}
        />
      </MapContainer>
    </Container>
  );
}