## AFTER 15 NOV 12:00AM NO COMMIT WHERE ADDED INTO MAIN PROJECT 
# GetFire 🔥
<img width="1672" height="941" alt="file_00000000047482118bf46b13115b8f80" src="https://github.com/user-attachments/assets/6fe8ef11-dfde-45b8-b86f-e031430214ef" />

**Explore burning activity across our planet through satellite
observations.**

GetFire is a global fire-activity exploration platform developed for the
**NASA Space Apps Challenge 2026**. It is designed to bring
satellite-detected active-fire observations into one accessible
experience, helping users explore where burning is detected and how
activity changes over time.


------------------------------------------------------------------------

## The Problem

Satellite systems can detect active-fire hotspots around the world, but
observations from different sensors, dates, and locations can be
difficult to explore as one coherent picture. A map of individual
hotspots is useful, yet it may not make longer-term or recurring
patterns easy to understand.

## Our Solution

GetFire aims to make global burning activity easier to explore by
combining geographic and time-based views in one workspace.

The platform is designed to help users: - Explore fire observations on
an interactive global map. - Distinguish observations by sensor
category, including MODIS and VIIRS where available. - Examine activity
across selected dates and regions. - Explore patterns through map-based
and analytical views. - Export data for further exploration, where
supported.

GetFire is an exploration and analysis aid. It is **not** a replacement
for official emergency alerts, incident reports, or local authorities.

## Key Features

### 🌍 Interactive Global Map

A world map provides a geographic view of fire-observation markers.
Marker styling communicates sensor categories, and marker size can
represent Fire Radiative Power (FRP), where that field is available.

### 🗓️ Time-Based Fire Activity

The project is designed around exploring how detected burning activity
changes over time, including a burning-activity calendar.

### 🛰️ Sensor-Aware Exploration

The interface includes categories for: - **MODIS** - **VIIRS** -
**Both** (combined sensor view, where supported)

### 📊 Analytics Workspace

An analytics area is included in the interface for exploring
fire-activity information and patterns.

### 📤 Data Export

An export-data area is included in the interface for making data
available outside the application, where implemented.


## Who Can Use GetFire?

-   **Emergency responders:** geographic and historical context when
    reviewing detected activity.
-   **Scientists and researchers:** explore observations across dates
    and regions for further analysis.
-   **Land managers:** examine recurring or seasonal burning patterns to
    inform research and planning.

## Data and Methodology

The current interface identifies **MODIS** and **VIIRS** sensor
categories. The intended processing workflow is:

1.  **Collect** active-fire observations from the selected satellite
    data sources.
2.  **Prepare** records by checking and standardizing fields used by the
    application.
3.  **Harmonize** time, location, and record structure so observations
    can be explored consistently.
4.  **Aggregate** observations by selected time periods and areas, where
    required.
5.  **Visualize** results through the global map, calendar, and
    analytics views.

## Technology

The current development setup indicates the following working stack.
Verify it against the repository's actual dependencies before the final
submission:

-   **Frontend:** React / JavaScript
-   **Mapping:** Leaflet
-   **Charts and visualizations:** Recharts
-   **Backend:** Python (ASGI server / Uvicorn)

## Getting Started

The commands below describe the expected local development workflow.
Check the actual scripts and backend entry point in your repository if
their names differ.

### Prerequisites

-   Node.js and npm
-   Python 3
-   Git

### 1. Clone the repository

``` bash
git clone [YOUR_GITHUB_REPOSITORY_URL]
cd [YOUR_REPOSITORY_FOLDER]
```

### 2. Start the frontend

``` bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by the frontend development server.

### 3. Start the backend

Open a second terminal:

``` bash
cd backend
python -m venv venv
```

Activate the virtual environment:

**Windows PowerShell**

``` powershell
.\venv\Scripts\Activate.ps1
```

**macOS / Linux**

``` bash
source venv/bin/activate
```

Install backend dependencies:

``` bash
pip install -r requirements.txt
```

Start the backend using the ASGI application entry point in your
repository:

``` bash
uvicorn <your_module>:app --reload
```

Replace `<your_module>` with the Python module that defines the
application object. For example, if it is in `main.py`, use
`uvicorn main:app --reload`. If your project uses a different framework
or startup command, follow the backend source or project configuration.

## Project Structure

The project has been developed with separate frontend and backend areas.

``` text
GetFire/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/
│   ├── [backend application files]
│   └── requirements.txt
└── README.md
```


## Current Limitations

-   The map can fall back to demo data when the backend is unavailable.
-   Demo data must not be interpreted as real-time fire detections.
-   Live-data coverage, refresh frequency, and sensor-specific
    processing depend on the final backend integration.
-   GetFire is not an operational fire-warning or emergency-dispatch
    system.

## Future Scope

-   Expand and validate satellite-data integrations.
-   Improve historical comparisons and seasonal pattern analysis.
-   Add clearer summaries for selected regions and time windows.
-   Strengthen data validation, provenance, and sensor metadata.
-   Improve export options for research and reporting workflows.
-   Explore optional notifications based on clearly defined data
    conditions, with appropriate validation.

## Contributing

Contributions, feedback, and suggestions are welcome.

1.  Fork the repository.
2.  Create a feature branch: `git checkout -b feature/your-feature`.
3.  Commit your changes: `git commit -m "Add your feature"`.
4.  Push the branch: `git push origin feature/your-feature`.
5.  Open a pull request describing your changes.

## Team

**Parallax™**\
Project: GetFire\
Challenge: NASA Space Apps Challenge 2026

## Acknowledgements

-   **NASA Space Apps Challenge** for the challenge and opportunity to
    build solutions using Earth-observation data.
-   **NASA Earth-observation and active-fire data providers:** add links
    and exact dataset acknowledgements for every dataset used in the
    final implementation.

------------------------------------------------------------------------

*Built by Parallax™ for the NASA Space Apps Challenge 2026.*
