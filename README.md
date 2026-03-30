# Morocco's Phosphate Value Chain

**Where value is created and where it leaves the system**

This interactive map explores Morocco's role in the global phosphate economy.

Morocco holds about 70% of the world's phosphate reserves. The country extracts the raw mineral and processes it into phosphoric acid and bulk fertilizers, which are exported worldwide. At the same time, higher-value specialty phosphate derivatives are still imported after further transformation abroad.

## The visualization shows:

- **major phosphate mines and industrial hubs inside Morocco**
- **domestic transport links between extraction and processing zones**
- **export destinations for phosphate rock, phosphoric acid, and fertilizers**
- **import origins of specialty downstream phosphate products**

The aim is to reveal how far Morocco's industrial transformation currently goes and where additional value is captured elsewhere in the global supply chain.

## Data

**Trade flows** are based on World Bank WITS (UN Comtrade) partner tables
(2024 data for fertilizers and phosphoric acid, 2023 for phosphate rock and specialty imports).

**Industrial sites** follow publicly documented OCP and Phosboucraa operations.

**Global reserve estimates** from USGS Mineral Commodity Summaries 2025 and the African Development Bank phosphate factsheet.

## Features

### Interactive Elements
- **Toggle between Exports and Imports** - Switch views to see different trade flows
- **Product Categories** - Explore different phosphate products:
  - Fertilizers (HS 3105)
  - Phosphoric acid (HS 280920) 
  - Phosphate rock (HS 251010)
  - Specialty phosphates (HS 2835)
- **Metrics** - View data by share (%), USD value, or tonnes
- **Domestic Infrastructure** - Toggle internal transport links within Morocco
- **Zoom-dependent rendering** - Clean world view, detailed when zoomed in

### Visual Design
- **Color-coded flows** - Exports (orange), Imports (blue), Domestic links (dark blue-gray)
- **Curved trade arrows** - Bezier curves for smooth flow visualization
- **Interactive tooltips** - Hover for detailed information
- **Smart highlighting** - Domestic links emphasize relevant infrastructure per product category

## Technical Implementation

- **Framework**: Leaflet.js for interactive mapping
- **Data sources**: World Bank WITS, USGS, OCP Group publications
- **Design**: Responsive layout with collapsible panels
- **Performance**: Efficient rendering with zoom-based detail levels

## Usage

1. **Explore the map** - Zoom in to see domestic infrastructure links
2. **Switch categories** - Use the dropdown to explore different products
3. **Toggle views** - Enable/disable sites, flows, and domestic links
4. **Check sources** - Click "Sources & Data" for detailed methodology

## License

This visualization is provided for educational and research purposes. For inquiries, contact: ro.elidrissi1@gmail.com

---

**Live visualization**: [View the interactive map](https://romeli7.github.io/earlyprototype/)
