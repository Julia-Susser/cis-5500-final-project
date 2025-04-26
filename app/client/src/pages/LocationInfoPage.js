import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, experimentalStyled, Link, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
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

  const [locationMetrics, setLocationMetrics] = useState([]);
  const [geometryData, setGeometryData] = useState([]);
  const [geometryMap, setGeometryMap] = useState([]);

useEffect(() => {
    const fetchGeometryData = async () => {
      try {
        const geometryRes = await fetch(`http://${config.server_host}:${config.server_port}/location/nyc_geometry`);
        const geometryJson = await geometryRes.json();
        setGeometryData(geometryJson);
  
        const mapRes = await fetch(`http://${config.server_host}:${config.server_port}/location/nyc_geometry_map`);
        const mapJson = await mapRes.json();
        setGeometryMap(mapJson.features || []);
  
        console.log('Fetched geometry data:', geometryJson);
        console.log('Fetched geometry map:', mapJson.features || []);
        
      } catch (err) {
        console.error('Error fetching geometry data or map:', err);
      }
    };
  
    fetchGeometryData();
  }, []);
  
  useEffect(() => {
    if (!locationId) return;
  
    const fetchData = async () => {
      setLocationMetrics({
        "total_pickups": 0,
        "total_dropoffs": 0,
        "collisions": 0,
        "total_injuries": 0,
        "average_trip_distance": 0,
        "safety_ranking": 0,
        "taxi_availability_rank": 0
      })
      try {
        console.log("hi")
        const pickupsRes = await fetch(`http://${config.server_host}:${config.server_port}/location/${locationId}/pickups_dropoffs`);
        const pickupsText = await pickupsRes.text();
        console.log('Pickups Response:', pickupsText);
        const pickupsJson = pickupsText ? JSON.parse(pickupsText) : {};
        console.log("hi1")
        const collisionsRes = await fetch(`http://${config.server_host}:${config.server_port}/location/${locationId}/collisions_injuries`);
        const collisionsText = await collisionsRes.text();
        console.log('Collisions Response:', collisionsText);
        const collisionsJson = collisionsText ? JSON.parse(collisionsText) : {};
        console.log("hi2")
        console.log("hi3")
        const safetyRes = await fetch(`http://${config.server_host}:${config.server_port}/location/${locationId}/safety_ranking`);
        const safetyText = await safetyRes.text();
        console.log('Safety Response:', safetyText);
        const safetyJson = safetyText ? JSON.parse(safetyText) : {};
        console.log("hi4")
  
        setLocationMetrics({
          total_pickups: pickupsJson.total_pickups,
          total_dropoffs: pickupsJson.total_dropoffs,
          collisions: collisionsJson.collisions,
          total_injuries: collisionsJson.total_injuries,
          safety_ranking: safetyJson.safety_rank,  // note: safety_rank from backend
          taxi_availability_rank: safetyJson.taxi_availability_rank
        });
  
        console.log({
          total_pickups: pickupsJson.total_pickups,
          total_dropoffs: pickupsJson.total_dropoffs,
          collisions: collisionsJson.collisions,
          total_injuries: collisionsJson.total_injuries,
          safety_ranking: safetyJson.safety_rank,
          taxi_availability_rank: safetyJson.taxi_availability_rank
        });
  
      } catch (error) {
        console.log()
        console.error('Error fetching location metrics:', error);
      }
    };
    fetchData();
  }, [locationId]);
  

  

    const features = geometryMap.map((item) => (item));
  

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
      <FitBounds features={geometryMap} />
      {geometryMap.map((feature, idx) => (
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
                const selectedLocation = geometryData.find(
                  (item) => item.zone === feature.properties.zone && item.borough === feature.properties.borough
                );
    
                if (selectedLocation) {
                    setLocationId(selectedLocation.location_id);
                    setBorough(selectedLocation.borough);
                    setZone(selectedLocation.zone);
                  alert(`Zone: ${selectedLocation.zone} Borough: ${selectedLocation.borough}`);
                } else {
                  alert('No Data for selected location');
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
    <TableBody key={locationId}>
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