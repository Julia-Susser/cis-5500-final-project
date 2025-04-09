import { AppBar, Container, Toolbar, Typography } from '@mui/material'
import { NavLink } from 'react-router-dom';
import { orange } from '@mui/material/colors';  // Add this import

// The hyperlinks in the NavBar contain a lot of repeated formatting code so a
// helper component NavText local to the file is defined to prevent repeated code.
function NavText({ href, text, isMain }) {
  return (
    <Typography
      variant={isMain ? 'h5' : 'h7'}
      noWrap
      style={{
        marginRight: '30px',
        fontFamily: "'Segoe UI', 'Roboto', sans-serif",
        fontWeight: isMain ? 600 : 500,
        letterSpacing: '.2rem',
        textTransform: 'uppercase',
      }}
    >
      <NavLink
        to={href}
        style={{
          color: 'inherit',
          textDecoration: 'none',
          '&:hover': {
            color: orange[200],
          }
        }}
      >
        {text}
      </NavLink>
    </Typography>
  )
}

// Here, we define the NavBar. Note that we heavily leverage MUI components
// to make the component look nice. Feel free to try changing the formatting
// props to how it changes the look of the component.
export default function NavBar() {
  return (
    <AppBar position='static'>
      <Container maxWidth='xl'>
        <Toolbar disableGutters>
          <NavText href='/' text='NYC-Taxi-Data-App' isMain />
          <NavText href='/albums' text='ALBUMS' />
          <NavText href='/songs' text='SONGS' />
        </Toolbar>
      </Container>
    </AppBar>
  );
}
