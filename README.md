# NYC Taxi Analytics Project

This application provides insights into 2024 collision and taxi statistics, enabling users to analyze trends and explore the tradeoffs between safety and taxi availability. Users can investigate fare patterns, trip distances, accident rates, and safety rankings across various locations and time periods.

## Project Structure

The repository is organized as follows:

```
final-project/
├── app/
│   ├── server/
│   │   ├── db.js                # Handles the PostgreSQL database connection using the `pg` library.
│   │   ├── server.js            # Main Express server file that initializes the application and defines API endpoints.
│   │   ├── routes/              # Directory containing modular route handlers for different API groups.
│   │   │   ├── locationRoutes.js # Handles location-based analytics (e.g., pickups, drop-offs, safety rankings).
│   │   │   ├── areaRoutes.js     # Handles area-based analytics (e.g., peak hours, tip analysis, collision hotspots, proximity analysis).
│   │   │   ├── timeRoutes.js     # Handles time-based analytics (e.g., safety by season, collision rates).
│   │   ├── config.json          # Configuration file containing database credentials and server settings.
│   │   ├── routes.js            # Aggregates and exports all route handlers.
├── input/                       # Directory for raw input files (e.g., CSVs, JSONs) used for data ingestion.
├── data/
│   ├── src/                     # Directory for data processing scripts and notebooks.
│   │   ├── processing.ipynb     # Jupyter Notebook for cleaning and transforming raw data.
│   │   ├── populate_database.txt # SQL script for populating the database with processed data.
│   │   ├── schema.sql           # SQL script for creating the database schema.
├── frontend/                    # Directory for the frontend application (currently empty).
```

### File Descriptions
server:
Contains the backend server code, including database connection, route handlers, and server initialization.

input:
Stores raw input files used for data ingestion and processing.
Example files:
taxi_data.csv: Raw taxi trip data.
collision_data.csv: Raw collision data.
geometry_data.json: Raw geometry data for NYC zones.

src:
Contains scripts and notebooks for pre-processing, performing eda on raw data and uploading to sql.
- processing.ipynb: Jupyter Notebook for cleaning and transforming raw data.
- populate_database.txt: SQL script for populating the database with processed data.

frontend/:
- Placeholder directory for the frontend
---

## Frontend


## API Endpoints

### Location-Based Analytics
- **GET /location/:location_id/pickups_dropoffs**: Retrieves total taxi pickups and drop-offs in a given location.
- **GET /location/:location_id/collisions_injuries**: Retrieves the number of collisions and injuries recorded in the area.
- **GET /location/:location_id/fare_trip_distance**: Retrieves the average fare and trip distance for rides in the location.
- **GET /location/:location_id/safety_ranking**: Retrieves the ranking of the area in terms of safety and taxi availability.

### Time-Based Analytics
- **GET /time/safety_by_season**: Analyzes how safety (collisions) varies by season.
- **GET /time/collision_rate**: Computes the collision rate per 1,000 taxi rides at a location in a date range.
- **GET /time/same_collision_date_hours**: Finds hours with repeated collisions on the same date.

### Area-Based Analytics
- **GET /area/peak_hours**: Finds peak hours and most active pickup locations.
- **GET /area/tip_analysis**: Analyzes locations with tip averages above certain thresholds.
- **GET /area/collision_hotspots**: Identifies collision hotspots with very few taxi pickups.
- **GET /collision/proximity_analysis**: Analyzes proximity of collisions to taxi pickups (within 5000 meters).
- **GET /collision/on_street/:street_name**: Retrieves collisions involving a specific street name.


## Technologies Used
- **Node.js**: Backend runtime environment.
- **Express**: Web framework for building RESTful APIs.
- **PostgreSQL**: Relational database for storing and querying data.
- **pg**: PostgreSQL client for Node.js.
