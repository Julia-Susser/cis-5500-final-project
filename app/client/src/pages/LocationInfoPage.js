import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { MapContainer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import React from 'react';
import 'leaflet/dist/leaflet.css';

const config = require('../config.json');

export default function LocationInfoPage() {
  // Extract `location_id` from the URL parameters
  const { location_id } = useParams();

  // State variables to store location details and metrics
  const [locationId, setLocationId] = useState('');
  const [borough, setBorough] = useState('');
  const [zone, setZone] = useState('');
  const [locationMetrics, setLocationMetrics] = useState([]);
  const [geometryData, setGeometryData] = useState([]);
  const [geometryMap, setGeometryMap] = useState([]);

  // Fetch NYC geometry data and map data on component mount
  useEffect(() => {
    const fetchGeometryData = async () => {
      try {
        // Fetch geometry data for NYC zones
        const geometryRes = await fetch(`http://${config.server_host}:${config.server_port}/location/nyc_geometry`);
        const geometryJson = await geometryRes.json();
        setGeometryData(geometryJson);

        // Fetch GeoJSON map data for NYC zones
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

  // Fetch location-specific metrics when `locationId` changes
  useEffect(() => {
    if (!locationId) return;

    const fetchData = async () => {
      // Initialize metrics with default values
      setLocationMetrics({
        total_pickups: 0,
        total_dropoffs: 0,
        collisions: 0,
        total_injuries: 0,
        safety_ranking: 0,
        taxi_availability_rank: 0,
      });

      try {
        // Fetch pickups and drop-offs data
        const pickupsRes = await fetch(`http://${config.server_host}:${config.server_port}/location/${locationId}/pickups_dropoffs`);
        const pickupsJson = await pickupsRes.json();

        // Fetch collisions and injuries data
        const collisionsRes = await fetch(`http://${config.server_host}:${config.server_port}/location/${locationId}/collisions_injuries`);
        const collisionsJson = await collisionsRes.json();

        // Fetch safety and taxi availability rankings
        const safetyRes = await fetch(`http://${config.server_host}:${config.server_port}/location/${locationId}/safety_ranking`);
        const safetyJson = await safetyRes.json();

        // Update location metrics with fetched data
        setLocationMetrics({
          total_pickups: pickupsJson.total_pickups,
          total_dropoffs: pickupsJson.total_dropoffs,
          collisions: collisionsJson.collisions,
          total_injuries: collisionsJson.total_injuries,
          safety_ranking: safetyJson.safety_rank,
          taxi_availability_rank: safetyJson.taxi_availability_rank,
        });

        console.log('Updated location metrics:', {
          total_pickups: pickupsJson.total_pickups,
          total_dropoffs: pickupsJson.total_dropoffs,
          collisions: collisionsJson.collisions,
          total_injuries: collisionsJson.total_injuries,
          safety_ranking: safetyJson.safety_rank,
          taxi_availability_rank: safetyJson.taxi_availability_rank,
        });
      } catch (error) {
        console.error('Error fetching location metrics:', error);
      }
    };

    fetchData();
  }, [locationId]);

  // Helper function to fit map bounds to the selected features
  function FitBounds({ features }) {
    const map = useMap();
    React.useEffect(() => {
      if (features.length > 0) {
        const allBounds = features.map((feature) => L.geoJSON(feature).getBounds());
        const combinedBounds = allBounds.reduce((acc, bounds) => acc.extend(bounds));
        map.fitBounds(combinedBounds);
      }
    }, [features, map]);

    return null;
  }

  return (
    <Container
      sx={{
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
          overflow: 'auto',
        },
      }}
    >
      {/* Map displaying NYC zones */}
      <MapContainer
        center={[40.7128, -74.006]} // Default center (NYC)
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
                    (item) =>
                      item.zone === feature.properties.zone &&
                      item.borough === feature.properties.borough
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

      {/* Display location details */}
      <h2>
        Location Details:
        {zone && borough && locationId
          ? ` Zone: ${zone}, Borough: ${borough}, Location ID: ${locationId}`
          : ' Select a location on the map to view details.'}
      </h2>

      {/* Table displaying location metrics */}
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
                <TableCell>{key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</TableCell>
                <TableCell>{typeof value === 'object' ? <pre>{JSON.stringify(value, null, 2)}</pre> : value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}