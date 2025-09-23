# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

# DataPipeline Dashboard

A powerful React-TypeScript data processing platform that transforms raw data into actionable insights through visual pipelines.

![Main Dashboard](screenshots/dashboard.png)

## Features

### 📊 Multiple Data Sources
- **CSV Upload** - Process local files with drag-and-drop interface
- **Live Stock Data** - Real-time stock quotes via Alpha Vantage API
- **Weather Data** - Current weather conditions for any global city
- **Sample Datasets** - Pre-loaded data for quick demonstrations

### 🔧 Visual Pipeline Builder
- **Filtering** - Filter data by any column with custom criteria
- **Calculations** - Statistical analysis (averages, aggregations)
- **Visualizations** - Interactive charts (bar charts, pie charts)

### 📈 Advanced Analytics
- **Multi-City Weather Comparison** - Compare temperatures, humidity across multiple locations
- **Multi-Stock Analysis** - Track and compare multiple stock symbols
- **Interactive Charts** - Hover tooltips, responsive design
- **Data Export** - Download processed results as CSV

![Weather Comparison](screenshots/weather-chart.png)

## Technical Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Charts**: Recharts library for data visualization
- **APIs**: Alpha Vantage (stocks), OpenWeatherMap (weather)
- **File Processing**: FileReader API for CSV parsing
- **HTTP Client**: Axios for API requests

## Live Demo

Try the application: [DataPipeline Dashboard](https://your-deployed-url.vercel.app)

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
git clone https://github.com/Joana2337/Datapipeline-.git
cd Datapipeline-
npm install
npm start