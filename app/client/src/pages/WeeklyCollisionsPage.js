import { useEffect, useState } from 'react';
import { Container, FormControl, InputLabel, MenuItem, Select, Slider, Typography, Box } from '@mui/material';
import { MapContainer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import React from 'react';
import 'leaflet/dist/leaflet.css';

const config = require('../config.json');

// Helper function to determine the color based on collision count
function getColor(count, minCount, maxCount) {
  // Return grey for undefined/null values or if min and max are the same
  if (count === undefined || count === null || 
      minCount === undefined || maxCount === undefined || 
      minCount === maxCount) {
    return '#808080';  // Grey color
  }
  
  // Calculate percentage between min and max
  const percentage = (count - minCount) / (maxCount - minCount);
  
  // Ensure percentage is between 0 and 1
  const boundedPercentage = Math.max(0, Math.min(1, percentage));
  
  // Convert from yellow (rgb(255, 255, 0)) to red (rgb(255, 0, 0))
  const green = Math.round(255 * (1 - boundedPercentage));
  
  return `rgb(255, ${green}, 0)`;
}

// Component to automatically fit map bounds to the displayed features
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
  // State variables for managing boroughs, geometry data, weeks, and collision counts
  const [boroughs, setBoroughs] = useState([]);
  const [selectedBorough, setSelectedBorough] = useState('All Boroughs');
  const [geometryData, setGeometryData] = useState([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [boroughGeometryMap, setBoroughGeometryMap] = useState([]);
  const [collisionCounts, setCollisionCounts] = useState([]);

  // Generate available weeks for the last 12 weeks
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

  // Generate weeks for the year 2024
  useEffect(() => {
    const weeks = [];
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    
    // Get the first Monday of 2024
    while (startDate.getDay() !== 1) {
      startDate.setDate(startDate.getDate() + 1);
    }

    // Generate all weeks until the end of 2024
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
        const uniqueBoroughs = ['All Boroughs', ...new Set(data.map(item => item.borough))].filter(Boolean);
        console.log('Unique boroughs:', uniqueBoroughs);
        setBoroughs(uniqueBoroughs);
      })
      .catch(error => {
        console.error('Error fetching borough data:', error);
      });
  }, []);

  // Fetch collision data for the selected week and borough
  useEffect(() => {
    if (availableWeeks[selectedWeekIndex]) {
      const startDate = new Date(availableWeeks[selectedWeekIndex].value);
      const endDate = new Date(availableWeeks[selectedWeekIndex].value);
      endDate.setDate(startDate.getDate() + 6);

      const url = new URL(`http://${config.server_host}:${config.server_port}/safety/weekly_collisions`);
      if (selectedBorough !== 'All Boroughs') {
        url.searchParams.append('borough', selectedBorough);
      }
      url.searchParams.append('start_date', startDate.toISOString().split('T')[0]);
      url.searchParams.append('end_date', endDate.toISOString().split('T')[0]);

      console.log('Fetching collision data from:', url.toString());

      fetch(url)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('Received collision counts:', data);
          const processedData = data.map(item => ({
            ...item,
            collision_count: parseInt(item.collision_count, 10) || 0
          }));
          setCollisionCounts(processedData);
        })
        .catch(error => {
          console.error('Error fetching collision counts:', error);
          setCollisionCounts([]);
        });
    }
  }, [selectedBorough, selectedWeekIndex, availableWeeks]);

  // Fetch borough geometry map
  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/location/nyc_geometry_map`)
      .then(res => res.json())
      .then(data => {
        const boroughFeatures = selectedBorough === 'All Boroughs' 
          ? data.features
          : data.features.filter(feature => feature.properties.borough === selectedBorough);

        console.log('data.features: ', data.features);
        console.log('Borough.features: ', boroughFeatures);

        setBoroughGeometryMap(boroughFeatures);
      })
      .catch(error => {
        console.error('Error fetching geometry map:', error);
      });
  }, [selectedBorough]);

  // Handle borough selection change
  const handleBoroughChange = (event) => {
    setSelectedBorough(event.target.value);
    setBoroughGeometryMap([]); 
  };

  // Generate slider marks for weeks
  const marks = availableWeeks.map((week, index) => ({
    value: index,
    label: week.month
  })).filter((mark, index, array) => {
    return index === 0 || mark.label !== array[index - 1].label;
  });

  return (
    <Container>
      <h1>Weekly Collisions by Neighborhood</h1>
      
      {/* Borough selection dropdown */}
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

      {/* Week selection slider */}
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

      {/* Map displaying collision data */}
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
            {(() => {
              const collisionMap = new Map(
                collisionCounts.map(c => [c.location_id, c.collision_count])
              );
              const allCounts = boroughGeometryMap.map(geo => 
                collisionMap.get(geo.properties.location_id) || 0
              );
              const minCount = Math.min(...allCounts);
              const maxCount = Math.max(...allCounts);
              
              return boroughGeometryMap.map((geo, idx) => {
                const locationId = geo.properties.location_id;
                const count = collisionMap.get(locationId) || 0;
                const fillColor = getColor(count, minCount, maxCount);
                
                return (
                  <GeoJSON 
                    key={`${locationId}-${idx}-${count}`}
                    data={geo.geometry} 
                    style={{
                      color: '#666',
                      weight: 1,
                      fillOpacity: 0.8,
                      fillColor: fillColor,
                    }}
                    onEachFeature={(feature, layer) => {
                      const popup = L.popup();
                      layer.on('click', () => {
                        popup.setContent(
                          `Location: ${geo.properties.zone}<br/>
                           Collisions: ${count}`
                        );
                        layer.bindPopup(popup);
                      });
                    }}
                  />
                );
              });
            })()}
          </>
        )}
      </MapContainer>
      <Box sx={{ height: '300px' }} />
    </Container>
  );
}