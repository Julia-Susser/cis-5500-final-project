# NYC Taxi Analytics Project

This application provides insights into 2024 collision and taxi statistics, enabling users to analyze trends and explore the tradeoffs between safety and taxi availability. Users can investigate fare patterns, trip distances, accident rates, and safety rankings across various locations and time periods.


## Running the Application

### Step 1: Run the Backend Server

1. Navigate to the `server/` directory:

   ```bash
   cd app/server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. The backend server will run at [http://localhost:3001](http://localhost:3001)  
   (or the port specified in `config.json`).

---

### Step 2: Run the Frontend Application

1. Navigate to the `client/` directory:

   ```bash
   cd app/client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Open the application in your browser at:  
   [http://localhost:3000](http://localhost:3000)


## Project Structure

The repository is organized as follows:

```
final-project/
├── app/
│   ├── client/
│   │   ├── node_modules/
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── NavBar.js
│   │   │   ├── helpers/
│   │   │   ├── pages/
│   │   │   │   ├── hw3/
│   │   │   │   ├── CollisionsByDatePage.js
│   │   │   │   ├── LocationInfoPage.js
│   │   │   │   ├── TopStatsPage.js
│   │   │   ├── App.js
│   │   │   ├── config.json
│   │   │   ├── index.js
│   │   ├── .gitignore
│   │   ├── package.json
│   │   ├── package-lock.json
│
│   ├── server/
│   │   ├── __tests__/
│   │   ├── node_modules/
│   │   ├── routes/
│   │   │   ├── areaRoutes.js
│   │   │   ├── locationRoutes.js
│   │   │   ├── safetyRoutes.js
│   │   │   ├── timeRoutes.js
│   │   ├── config.json
│   │   ├── db.js
│   │   ├── routes.js
│   │   ├── server.js
│   │   ├── .gitignore
│   │   ├── package.json
│   │   ├── package-lock.json
│
├── input/
│   ├── <raw data files e.g., CSVs>
│
├── data/
│   ├── src/
│   │   ├── processing.ipynb
│   │   ├── populate_database.txt
│   │   ├── schema.txt
```

## File Descriptions

### Backend Server
Contains the backend server code, including database connection, route handlers, and server initialization.

- **`db.js`**: Manages the PostgreSQL database connection.
- **`server.js`**: Initializes the Express server and defines API endpoints.
- **`routes/`**:
  - **`locationRoutes.js`**: Location-based analytics (e.g., pickups, drop-offs, safety rankings).
  - **`areaRoutes.js`**: Area-based analytics (e.g., peak hours, tip analysis, collision hotspots).
  - **`timeRoutes.js`**: Time-based analytics (e.g., safety by season, collision rates).
  - **`collisionRoutes.js`**: Collision-related analytics (e.g., proximity analysis, collisions on streets).
- **`config.json`**: Stores database credentials and server settings.
- **`routes.js`**: Aggregates and exports all route handlers.

---

### Input
Stores raw input files for data ingestion.

- **`taxi_data.csv`**: Raw taxi trip data.
- **`collision_data.csv`**: Raw collision data.
- **`geometry_data.json`**: Raw geometry data for NYC zones.

---

### Data Processing (`data/src/`)
Scripts and notebooks for cleaning and transforming raw data.

- **`processing.ipynb`**: Jupyter Notebook for data cleaning and transformation.
- **`populate_database.txt`**: SQL script for populating the database.
- **`schema.sql`**: SQL script for creating the database schema.

---

### Frontend (`app/client/`)
Contains the React-based frontend application.

- **`public/`**: Static assets like `index.html`.
- **`src/components/`**: Reusable UI components (e.g., `NavBar.js`, `LazyTable.js`).
- **`src/pages/`**: Page-level components mapped to frontend routes (e.g., `TopStatsPage.js`, `LocationInfoPage.js`).
- **`src/helpers/`**: Utility functions and shared logic.
- **`App.js`**: Root component that defines the structure of the app.
- **`index.js`**: Entry point for rendering the app.
- **`config.json`**: Stores frontend configuration (e.g., API base URLs).

---



## API Endpoints

---

### API Endpoints (`server/server.js`)
The Express server exposes the following RESTful API endpoints for location, time, and area-based NYC taxi analytics.

- **`GET /location/:location_id/pickups_dropoffs`**  
  Returns the total number of taxi pickups and drop-offs for a specific location.

- **`GET /location/:location_id/collisions_injuries`**  
  Returns the number of collisions and injuries in a specific location.

- **`GET /location/:location_id/fare_trip_distance`**  
  Returns average fare and trip distance for a specific location.

- **`GET /location/:location_id/safety_ranking`**  
  Returns a safety and taxi availability ranking for the specified location.

- **`GET /location/nyc_geometry`**  
  Returns NYC zone geometries for mapping and analysis.

- **`GET /location/nyc_geometry_map`**  
  Returns full geometry data for client-side map rendering.


- **`GET /time/safety_by_season`**  
  Analyzes how safety varies by season (e.g., winter vs. summer).

- **`GET /time/collision_rate?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&location_id=ID`**  
  Computes collision rate per 1,000 taxi rides in a date range at a location.

- **`GET /time/same_collision_date_hours`**  
  Identifies repeated collisions occurring at the same hours across dates.

- **`GET /time/collisions?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`**  
  Returns all collisions occurring within a given date range.

- **`GET /area/peak_hours`**  
  Finds peak taxi activity hours and pickup locations.

- **`GET /area/tip_analysis`**  
  Analyzes average tip amounts across different areas.

- **`GET /area/collision_hotspots`**  
  Identifies areas with high collisions but low taxi activity.

- **`GET /collision/proximity_analysis`**  
  Measures spatial proximity of collisions to taxi pickups (within 5000m).

- **`GET /safety/weekly_collisions?borough=BOROUGH&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`**  
  Returns weekly collision statistics for a borough over a date range.

---



## Technologies Used
- **Node.js**: Backend runtime environment.
- **Express**: Web framework for building RESTful APIs.
- **PostgreSQL**: Relational database for storing and querying data.
- **pg**: PostgreSQL client for Node.js.
