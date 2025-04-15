import { useEffect, useState } from 'react';
import { Box, Container, TextField, Button, Typography } from '@mui/material';

const config = require('../config.json');

export default function CollisionsByDatePage() {
  const [collisions, setCollisions] = useState([]);
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [page, setPage] = useState(0);
  const limit = 24;

  const fetchCollisions = () => {
    const offset = page * limit;
    const url = `http://${config.server_host}:${config.server_port}/time/collisions?start_date=${startDate}&end_date=${endDate}&limit=${limit}&offset=${offset}`;
    console.log('Fetching collisions from:', url);

    fetch(url)
      .then(res => res.json())
      .then(resJson => Array.isArray(resJson) ? setCollisions(resJson) : setCollisions([]))
      .catch(err => {
        console.error("Error fetching collisions:", err);
        setCollisions([]);
      });
  };

  useEffect(() => {
    fetchCollisions();
  }, [page]); // Re-fetch when page changes

  const handleSearch = () => {
    setPage(0); // Reset to first page when dates change
    fetchCollisions();
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom> Collisions in 2024</Typography>

      <Box mb={3} display="flex" gap={2}>
        <TextField
          type="date"
          label="Start Date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          inputProps={{ min: '2024-01-01', max: '2024-12-31' }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          label="End Date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          inputProps={{ min: '2024-01-01', max: '2024-12-31' }}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={handleSearch}>Search</Button>
      </Box>

      <Container style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-evenly' }}>
        {collisions.map((c) => (
          <Box
            key={c.collision_id}
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
            <Typography variant="h6">{c.collision_id}</Typography>
            <Typography variant="body2"> {c.crash_date}</Typography>
            <Typography variant="body2"> Lat: {c.latitude}, Lon: {c.longitude}</Typography>
            <Typography variant="body2">Injured: {c.number_of_persons_injured}</Typography>
            <Typography variant="body2">Killed: {c.number_of_persons_killed}</Typography>
          </Box>
        ))}
      </Container>

      <Box display="flex" justifyContent="center" mt={4} gap={2}>
        <Button
          variant="outlined"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <Typography variant="body1" align="center">Page {page + 1}</Typography>
        <Button
          variant="outlined"
          disabled={collisions.length < limit}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </Box>
    </Container>
  );
}
