import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider } from '@mui/material'
import { teal, orange } from '@mui/material/colors'
import { createTheme } from "@mui/material/styles";

import NavBar from './components/NavBar';
import LocationInfoPage from './pages/LocationInfoPage';
import WeeklyCollisionsPage from './pages/WeeklyCollisionsPage';

// createTheme enables you to customize the look and feel of your app past the default
// in this case, we customize the color scheme, typography, and component styles
export const theme = createTheme({
  palette: {
    primary: {
      main: teal[700],
    },
    secondary: {
      main: orange[500],
    },
    background: {
      default: '#f5f5f5',
    }
  },
  typography: {
    fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: teal[900],
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      color: teal[800],
    }
  },
  components: {
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: teal[50],
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: teal[900],
        }
      }
    }
  }
});

// App is the root component of our application and as children contain all our pages
// We use React Router's BrowserRouter and Routes components to define the pages for
// our application, with each Route component representing a page and the common
// NavBar component allowing us to navigate between pages (with hyperlinks)
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<LocationInfoPage />} />
          <Route path="/location/:location_id" element={<LocationInfoPage />} />
          <Route path="/weekly-collisions" element={<WeeklyCollisionsPage />} />
          {/* add a link to the WeeklyCollisions Page below */}
          {/* <Route path="/weekly-collisions" element={<WeeklyCollisionsPage />} />*/}

          {/* <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/albums/:album_id" element={<AlbumInfoPage />} />
          <Route path="/songs" element={<SongsPage />} /> */}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}