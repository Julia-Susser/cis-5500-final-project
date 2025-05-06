import { useEffect, useState } from 'react';
import { Box, Container, TextField, Button, Typography } from '@mui/material';

const config = require('../config.json');

export default function CollisionsByDatePage() {
  // State variables to store collisions data, date range, and pagination
  const [collisions, setCollisions] = useState([]); // Stores the list of collisions
  const [startDate, setStartDate] = useState('2024-01-01'); // Start date for filtering collisions
  const [endDate, setEndDate] = useState('2024-12-31'); // End date for filtering collisions
  const [page, setPage] = useState(0); // Current page for pagination
  const limit = 24; // Number of collisions to fetch per page

  // Function to fetch collisions data from the backend
  const fetchCollisions = () => {
    const offset = page * limit; // Calculate the offset for pagination
    const url = `http://${config.server_host}:${config.server_port}/time/collisions?start_date=${startDate}&end_date=${endDate}&limit=${limit}&offset=${offset}`;
    console.log('Fetching collisions from:', url);

    fetch(url)
      .then(res => res.json())
      .then(resJson => Array.isArray(resJson) ? setCollisions(resJson) : setCollisions([])) // Update state with fetched data
      .catch(err => {
        console.error("Error fetching collisions:", err);
        setCollisions([]); // Reset collisions to an empty array on error
      });
  };

  // useEffect to fetch collisions whenever the page changes
  useEffect(() => {
    fetchCollisions();
  }, [page]); // Dependency array ensures this runs when `page` changes

  // Function to handle search when the date range changes
  const handleSearch = () => {
    setPage(0); // Reset to the first page
    fetchCollisions(); // Fetch collisions with the updated date range
  };

  return (
    <Container>
      {/* Page title */}
      <Typography variant="h4" gutterBottom> Collisions in 2024</Typography>

      {/* Date range input and search button */}
      <Box mb={3} display="flex" gap={2}>
        <TextField
          type="date"
          label="Start Date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)} // Update start date
          inputProps={{ min: '2024-01-01', max: '2024-12-31' }} // Restrict date range
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          label="End Date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)} // Update end date
          inputProps={{ min: '2024-01-01', max: '2024-12-31' }} // Restrict date range
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={handleSearch}>Search</Button> {/* Trigger search */}
      </Box>

      {/* Display collisions in a grid layout */}
      <Container style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-evenly' }}>
        {collisions.map((c) => (
          <Box
            key={c.collision_id} // Unique key for each collision
            p={2}
            m={1}
            style={{
              width: '250px',
              background: '#ffe082',
              borderRadius: '16px',
              border: '2px solid #000',
              textAlign: 'center'
            }}
          >
            {/* Display collision details */}
            <Typography variant="h6">{c.collision_id}</Typography>
            <Typography variant="body2"> {c.crash_date}</Typography>
            <Typography variant="body2"> Lat: {c.latitude}, Lon: {c.longitude}</Typography>
            <Typography variant="body2">Injured: {c.number_of_persons_injured}</Typography>
            <Typography variant="body2">Killed: {c.number_of_persons_killed}</Typography>
          </Box>
        ))}
      </Container>

      {/* Pagination controls */}
      <Box display="flex" justifyContent="center" mt={4} gap={2}>
        <Button
          variant="outlined"
          disabled={page === 0} // Disable "Previous" button on the first page
          onClick={() => setPage(page - 1)} // Go to the previous page
        >
          Previous
        </Button>
        <Typography variant="body1" align="center">Page {page + 1}</Typography> {/* Display current page */}
        <Button
          variant="outlined"
          disabled={collisions.length < limit} // Disable "Next" button if fewer results than the limit
          onClick={() => setPage(page + 1)} // Go to the next page
        >
          Next
        </Button>
      </Box>

      {/* Spacer for layout */}
      <Box sx={{ height: '300px' }} />
    </Container>
  );
}