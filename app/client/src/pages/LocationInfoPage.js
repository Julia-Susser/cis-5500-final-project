import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Link, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import React from 'react';
import 'leaflet/dist/leaflet.css';

const config = require('../config.json');

export default function LocationInfoPage() {
  const { location_id } = useParams();
  const [locationId, setLocationId] = useState('');

  const [locationData, setLocationData] = useState([]);
  const [locationMetrics, setLocationMetrics] = useState([]);
  const [geometryData, setGeometryData] = useState([]);

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/location/nyc_geometry`)
      .then(res => res.json())
      .then(data => setGeometryData(data));

    // Fetch valid locations
    fetch(`http://${config.server_host}:${config.server_port}/location/valid_locations`)
      .then(res => res.json())
      .then(data => setLocationData(data));
    
    // Only fetch location-specific data if we have a location_id
    if (locationId) {
      // Fetch data for pickups and drop-offs
      fetch(`http://${config.server_host}:${config.server_port}/location/${locationId}/pickups_dropoffs`)
        .then(res => res.json())
        .then(data => setLocationMetrics(prev => [...prev, { title: 'Pickups & Drop-offs', data }]));

      // Fetch data for collisions and injuries
      fetch(`http://${config.server_host}:${config.server_port}/location/${locationId}/collisions_injuries`)
        .then(res => res.json())
        .then(data => setLocationMetrics(prev => [...prev, { title: 'Collisions & Injuries', data }]));

      // Fetch data for fare and trip distance
      fetch(`http://${config.server_host}:${config.server_port}/location/${locationId}/fare_trip_distance`)
        .then(res => res.json())
        .then(data => setLocationMetrics(prev => [...prev, { title: 'Fare & Trip Distance', data }]));

      // Fetch data for safety ranking
      fetch(`http://${config.server_host}:${config.server_port}/location/${locationId}/safety_ranking`)
        .then(res => res.json())
        .then(data => setLocationMetrics(prev => [...prev, { title: 'Safety Ranking', data }]));
    }
  }, [locationId]);

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
  
    return null; // unknown format
  }

  const features = geometryData.map((item) => ({
    type: "Feature",
    geometry: parseWKTPolygon(item.geometry_shp),
    properties: {
      zone: item.zone,
      borough: item.borough
    }
  }));

  function FitBounds({ features }) {
    const map = useMap();
  
    React.useEffect(() => {
      if (features.length > 0) {
        const allBounds = features.map((feature) =>
          L.geoJSON(feature).getBounds()
        );
        const combinedBounds = allBounds.reduce((acc, bounds) =>
          acc.extend(bounds)
        );
        map.fitBounds(combinedBounds);
      }
    }, [features, map]);
  
    return null;
  }
  
  return (
    <Container sx={{ 
      py: 4,
      '& .MuiTable-root': {
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderRadius: '8px',
      },
      '& pre': {
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'auto'
      }
    }}>
      <Stack direction="column" spacing={4}>
        <h1>Location Data for {locationId}</h1>
        {locationMetrics.map((metric, index) => (
          <div key={index}>
            <h2>{metric.title}</h2>
            <pre>{JSON.stringify(metric.data, null, 2)}</pre>
          </div>
        ))}
      </Stack>

      <MapContainer
      center={[40.7128, -74.0060]} // fallback center
      zoom={11}
      style={{ height: '100vh', width: '100%', background: '#f0f0f0' }}
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <FitBounds features={features} />
      {features.map((feature, idx) => (
        <GeoJSON
          key={idx}
          data={feature}
          style={{
            color: '#2c7bb6',
            weight: 1.5,
            fillOpacity: 0.4,
            fillColor: '#abd9e9',
          }}
          onEachFeature={(feature, layer) => {
            layer.on({
              click: () => {
                // Set the locationId when a feature is clicked
                const selectedLocationId = geometryData.find(
                  (item) => item.zone === feature.properties.zone && item.borough === feature.properties.borough
                )?.location_id;
    
                if (selectedLocationId) {
                  setLocationId(selectedLocationId);
                  alert(`Location ID set to: ${selectedLocationId}`);
                } else {
                  alert('Location ID not found for this feature.');
                }
              },
            });
          }}
        />
      ))}
    </MapContainer>


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