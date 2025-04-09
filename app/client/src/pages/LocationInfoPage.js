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
  const [borough, setBorough] = useState('');
  const [zone, setZone] = useState('');

  const [locationData, setLocationData] = useState([]);
  const [locationMetrics, setLocationMetrics] = useState([]);
  const [geometryData, setGeometryData] = useState([]);

  useEffect(() => {
    function fetchData() {
      fetch(`http://${config.server_host}:${config.server_port}/location/nyc_geometry`)
        .then(res => res.json())
        .then(data => setGeometryData(data));
  
      fetch(`http://${config.server_host}:${config.server_port}/location/valid_locations`)
        .then(res => res.json())
        .then(data => setLocationData(data));
  
      if (locationId) {
        const selectedLocation = geometryData.find((item) => item.location_id === locationId);
        if (selectedLocation) {
          setZone(selectedLocation.zone);
          setBorough(selectedLocation.borough);
        }
  
        fetch(`http://${config.server_host}:${config.server_port}/location/${locationId}/pickups_dropoffs`)
          .then(res => res.json())
          .then(pickupsJson =>
            setLocationMetrics(prev => ({
              ...prev,
              total_pickups: pickupsJson.total_pickups,
              total_dropoffs: pickupsJson.total_dropoffs
            }))
          );
  
        fetch(`http://${config.server_host}:${config.server_port}/location/${locationId}/collisions_injuries`)
          .then(res => res.json())
          .then(collisionsJson =>
            setLocationMetrics(prev => ({
              ...prev,
              collisions: collisionsJson.collisions,
              total_injuries: collisionsJson.total_injuries
            }))
          );
  
        fetch(`http://${config.server_host}:${config.server_port}/location/${locationId}/fare_trip_distance`)
          .then(res => res.json())
          .then(fareJson =>
            setLocationMetrics(prev => ({
              ...prev,
              average_fare: fareJson.average_fare,
              average_trip_distance: fareJson.average_distance
            }))
          );
  
        fetch(`http://${config.server_host}:${config.server_port}/location/${locationId}/safety_ranking`)
          .then(res => res.json())
          .then(safetyJson =>
            setLocationMetrics(prev => ({
              ...prev,
              safety_ranking: safetyJson.safety_ranking,
              safety_ranking: safetyJson.taxi_availability_rank
            }))
          );
      }
    }
  
    fetchData();
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


      <MapContainer
      center={[40.7128, -74.0060]} // fallback center
      zoom={11}
      style={{ height: '30vh', width: '100%', background: '#f0f0f0' }}
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

    <h2>
      Location Details: 
      {zone && borough && locationId
        ? ` Zone: ${zone}, Borough: ${borough}, Location ID: ${locationId}`
        : ' Select a location on the map to view details.'}
    </h2>
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Attribute Type</TableCell>
            <TableCell>Attribute Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(locationMetrics).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>
              <TableCell>{typeof value === 'object' ? <pre>{JSON.stringify(value, null, 2)}</pre> : value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

  

    </Container>
  );
}