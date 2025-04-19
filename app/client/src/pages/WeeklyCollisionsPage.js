import { useEffect, useState } from 'react';
import { Container, FormControl, InputLabel, MenuItem, Select, Slider, Typography } from '@mui/material';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import React from 'react';
import 'leaflet/dist/leaflet.css';

// For Heatmap Layer
import { HeatmapLayer } from 'react-leaflet-heatmap-layer-v3';

const config = require('../config.json');

// Add FitBounds component for auto-zooming
function FitBounds({ features }) {
  const map = useMap();
  React.useEffect(() => {
    if (features && features.length > 0) {
      try {
        const allBounds = features.map(feature => L.geoJSON(feature).getBounds());
        const combinedBounds = allBounds.reduce((acc, bounds) => acc.extend(bounds));
        map.fitBounds(combinedBounds);
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }
  }, [features, map]);

  return null;
}

export default function WeeklyCollisionsPage() {
  // State management
  const [boroughs, setBoroughs] = useState([]);
  const [selectedBorough, setSelectedBorough] = useState('Manhattan');
  const [geometryData, setGeometryData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [boroughGeometryMap, setBoroughGeometryMap] = useState([]);

  // Generate available weeks (last 12 weeks)
  useEffect(() => {
    const weeks = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setDate(today.getDate() - (i * 7));
      weeks.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString(),
        month: date.toLocaleString('default', { month: 'short' })
      });
    }
    const sortedWeeks = weeks.reverse();
    setAvailableWeeks(sortedWeeks);
    setSelectedWeekIndex(0);
  }, []);

  // Generate weeks for 2024
  useEffect(() => {
    const weeks = [];
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    
    // Get the first Monday of 2024
    while (startDate.getDay() !== 1) {
      startDate.setDate(startDate.getDate() + 1);
    }

    // Generate all weeks until end of 2024
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      weeks.push({
        value: currentDate.toISOString().split('T')[0],
        label: `Week of ${currentDate.toLocaleDateString()}`,
        month: currentDate.toLocaleString('default', { month: 'short' })
      });
      currentDate.setDate(currentDate.getDate() + 7);
    }

    setAvailableWeeks(weeks);
    setSelectedWeekIndex(0);
  }, []);

  // Fetch borough geometries
  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/location/nyc_geometry`)
      .then(res => res.json())
      .then(data => {
        console.log('Received geometry data:', data);
        setGeometryData(data);
        const uniqueBoroughs = [...new Set(data.map(item => item.borough))].filter(Boolean);
        console.log('Unique boroughs:', uniqueBoroughs);
        setBoroughs(uniqueBoroughs);
      })
      .catch(error => {
        console.error('Error fetching borough data:', error);
      });
  }, []);

  // Fetch collision data when borough or week changes
  useEffect(() => {
    if (selectedBorough && availableWeeks[selectedWeekIndex]) {
      const startDate = new Date(availableWeeks[selectedWeekIndex].value);
      const endDate = new Date(availableWeeks[selectedWeekIndex].value);
      endDate.setDate(startDate.getDate() + 6);

      fetch(`http://${config.server_host}:${config.server_port}/time/same_collision_date_hours?borough=${selectedBorough}&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`)
        .then(res => res.json())
        .then(data => {
          const heatmapPoints = data.map(collision => ({
            lat: collision.latitude,
            lng: collision.longitude,
            intensity: 1
          }));
          setHeatmapData(heatmapPoints);
        });
    }
  }, [selectedBorough, selectedWeekIndex, availableWeeks]);

  // Fetch borough geometry map
  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/location/nyc_geometry_map`)
      .then(res => res.json())
      .then(data => {
        // Filter features for the selected borough
        const boroughFeatures = data.features.filter(
          feature => feature.properties.borough === selectedBorough
        );
        setBoroughGeometryMap(boroughFeatures);
      })
      .catch(error => {
        console.error('Error fetching geometry map:', error);
      });
  }, [selectedBorough]);

  const handleBoroughChange = (event) => {
    setSelectedBorough(event.target.value);
    setBoroughGeometryMap([]); 
  };

  const marks = availableWeeks.map((week, index) => ({
    value: index,
    label: week.month
  })).filter((mark, index, array) => {
    return index === 0 || mark.label !== array[index - 1].label;
  });

  return (
    <Container>
      <h1>Weekly Collisions by Neighborhood</h1>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Borough</InputLabel>
        <Select value={selectedBorough} onChange={handleBoroughChange}>
          {boroughs.map(borough => (
            <MenuItem key={borough} value={borough}>
              {borough}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <div style={{ padding: '20px 10px' }}>
        <Typography gutterBottom>
          Selected Week: {availableWeeks[selectedWeekIndex]?.label || 'Loading...'}
        </Typography>
        <Slider
          value={selectedWeekIndex}
          onChange={(_, newValue) => setSelectedWeekIndex(newValue)}
          min={0}
          max={availableWeeks.length - 1}
          marks={marks}
          step={1}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => availableWeeks[value]?.label || ''}
          sx={{ mt: 4 }}
        />
      </div>

      <MapContainer
        center={[40.7128, -74.0060]}
        zoom={11}
        style={{ height: '600px', width: '100%', marginTop: '20px', background: '#ffffff' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {boroughGeometryMap.length > 0 && (
          <>
            <FitBounds features={boroughGeometryMap.map(item => item.geometry)} />
            {boroughGeometryMap.map((geo, idx) => (
              <GeoJSON 
                key={idx} 
                data={geo.geometry} 
                style={{
                  color: '#2c7bb6',
                  weight: 1.5,
                  fillOpacity: 0.4,
                  fillColor: '#abd9e9'
                }}
              />
            ))}
          </>
        )}
        <HeatmapLayer
          points={heatmapData}
          longitudeExtractor={m => m.lng}
          latitudeExtractor={m => m.lat}
          intensityExtractor={m => m.intensity}
          radius={20}
          max={1}
          minOpacity={0.3}
        />
      </MapContainer>
    </Container>
  );
}