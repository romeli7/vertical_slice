/* ===============================
   3-SLIDE VERTICAL SLICE
   =============================== */
let TRADE_DATA = {};
let maps = {};
let currentSlide = 1;
let selectedYear = null;
let top3Partners = [];

// Load external trade data file
fetch('data/trade_flows.json')
  .then(response => response.json())
  .then(data => {
    // Convert external format to internal format
    TRADE_DATA = {
      exports: {
        fertilizers_bulk: {
          label: "Fertilizers",
          year: data.fertilizers_bulk.year,
          partners: data.fertilizers_bulk.rows.map(row => ({
            country: row.partner,
            valueUSD: row.value_usd,
            qtyKg: row.quantity_kg
          }))
        },
        phosphoric_acid: {
          label: "Phosphoric acid",
          year: data.phosphoric_acid.year,
          partners: data.phosphoric_acid.rows.map(row => ({
            country: row.partner,
            valueUSD: row.value_usd,
            qtyKg: row.quantity_kg
          }))
        },
        phosphate_rock: {
          label: "Phosphate rock",
          year: data.phosphate_rock_raw.year,
          partners: data.phosphate_rock_raw.rows.map(row => ({
            country: row.partner,
            valueUSD: row.value_usd,
            qtyKg: row.quantity_kg
          }))
        }
      }
    };
    
    // Initialize 3-slide experience
    initializeSlideSystem();
  })
  .catch(error => {
    console.error('Error loading trade data:', error);
  });

function initializeSlideSystem() {
  // Use all available export data across different years
  selectedYear = 'mixed'; // Will handle multiple years in calculations
  
  // Initialize maps
  initializeMaps();
  
  // Setup slide navigation
  setupSlideNavigation();
  
  // Load slide 1 data
  loadSlide1();
  
  // Show slide 1
  showSlide(1);
}

function initializeMaps() {
  // Map 1 - All exports
  maps.map1 = L.map("map1", { zoomControl: true }).setView([31.8, -6.0], 3);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(maps.map1);
  
  // Map 2 - Top 3 partners
  maps.map2 = L.map("map2", { zoomControl: true }).setView([31.8, -6.0], 3);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(maps.map2);
  
  // Create layers for both maps
  maps.map1.sitesLayer = L.layerGroup().addTo(maps.map1);
  maps.map1.partnersLayer = L.layerGroup().addTo(maps.map1);
  maps.map1.flowsLayer = L.layerGroup().addTo(maps.map1);
  
  maps.map2.sitesLayer = L.layerGroup().addTo(maps.map2);
  maps.map2.partnersLayer = L.layerGroup().addTo(maps.map2);
  maps.map2.flowsLayer = L.layerGroup().addTo(maps.map2);
}

function setupSlideNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const slideNum = parseInt(btn.dataset.slide);
      showSlide(slideNum);
    });
  });
}

function showSlide(slideNum) {
  // Update navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-slide="${slideNum}"]`).classList.add('active');
  
  // Update slides
  document.querySelectorAll('.slide').forEach(slide => {
    slide.classList.remove('active');
  });
  document.getElementById(`slide${slideNum}`).classList.add('active');
  
  currentSlide = slideNum;
  
  // Load slide-specific data
  if (slideNum === 1) {
    loadSlide1();
  } else if (slideNum === 2) {
    loadSlide2();
  } else if (slideNum === 3) {
    loadSlide3();
  }
}

/* ===============================
   SLIDE 1: ALL EXPORT DATA / CONTEXT
   =============================== */
function loadSlide1() {
  // Update year display to show mixed years
  document.getElementById('slide1-year').textContent = `Data Years: 2023-2024`;
  
  // Calculate total statistics across all export categories
  let totalPartners = new Set();
  let totalValue = 0;
  let categoryCount = 0;
  let years = new Set();
  
  Object.values(TRADE_DATA.exports).forEach(category => {
    // Include all export categories regardless of year
    categoryCount++;
    years.add(category.year);
    category.partners.forEach(partner => {
      if (partner.country !== "European Union") {
        totalPartners.add(partner.country);
        const value = partner.valueUSD || (partner.valueKUSD ? partner.valueKUSD * 1000 : 0);
        totalValue += isNaN(value) ? 0 : value;
      }
    });
  });
  
  // Update stats display with validation
  document.getElementById('total-partners').textContent = totalPartners.size;
  document.getElementById('total-value').textContent = formatUSD(isNaN(totalValue) ? 0 : totalValue);
  document.getElementById('total-categories').textContent = categoryCount;
  
  // Draw all export flows on map 1
  drawAllExportsMap(maps.map1);
}

function drawAllExportsMap(targetMap) {
  // Clear existing layers
  targetMap.sitesLayer.clearLayers();
  targetMap.partnersLayer.clearLayers();
  targetMap.flowsLayer.clearLayers();
  
  // Draw Morocco sites
  drawMoroccoSites(targetMap.sitesLayer);
  
  // Draw all export partners and flows
  Object.values(TRADE_DATA.exports).forEach(category => {
    // Include all export categories regardless of year
    category.partners.forEach(partner => {
      if (partner.country !== "European Union") {
        drawExportFlow(targetMap, partner, category.label);
      }
    });
  });
}

/* ===============================
   SLIDE 2: TOP 3 PARTNERS
   =============================== */
function loadSlide2() {
  // Update year display to show mixed years
  document.getElementById('slide2-year').textContent = `Data Years: 2023-2024`;
  
  // Calculate top 3 partners across all categories
  top3Partners = calculateTop3Partners();
  
  // Update ranking display
  updatePartnersRanking();
  
  // Draw top 3 partners on map 2
  drawTop3PartnersMap();
}

function calculateTop3Partners() {
  // Aggregate all export values by country across all categories
  const countryValues = {};
  
  Object.values(TRADE_DATA.exports).forEach(category => {
    // Include all export categories regardless of year
    console.log(`Processing category: ${category.label} with ${category.partners.length} partners`);
    category.partners.forEach(partner => {
      if (partner.country !== "European Union") {
        const value = partner.valueUSD || (partner.valueKUSD ? partner.valueKUSD * 1000 : 0);
        const validValue = isNaN(value) ? 0 : value;
        
        if (!countryValues[partner.country]) {
          countryValues[partner.country] = 0;
        }
        countryValues[partner.country] += validValue;
      }
    });
  });
  
  // Convert to array and sort by value
  const sortedCountries = Object.entries(countryValues)
    .map(([country, value]) => ({ country, value: isNaN(value) ? 0 : value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  
  // Calculate percentages
  const totalValue = sortedCountries.reduce((sum, country) => sum + country.value, 0);
  sortedCountries.forEach(country => {
    country.share = totalValue > 0 ? (country.value / totalValue * 100).toFixed(1) : '0.0';
  });
  
  return sortedCountries;
}

function updatePartnersRanking() {
  top3Partners.forEach((partner, index) => {
    const card = document.querySelector(`.rank-${index + 1}`);
    if (card) {
      card.querySelector('.partner-name').textContent = partner.country;
      card.querySelector('.partner-value').textContent = formatUSD(partner.value);
      card.querySelector('.partner-share').textContent = `${partner.share}% of top 3 total`;
    }
  });
}

function drawTop3PartnersMap() {
  // Clear existing layers
  maps.map2.sitesLayer.clearLayers();
  maps.map2.partnersLayer.clearLayers();
  maps.map2.flowsLayer.clearLayers();
  
  // Draw Morocco sites
  drawMoroccoSites(maps.map2.sitesLayer);
  
  // Draw only top 3 partners with enhanced styling
  top3Partners.forEach((partner, index) => {
    drawTop3Flow(maps.map2, partner, index + 1);
  });
}

/* ===============================
   SLIDE 3: DOWNLOAD REPORTS
   =============================== */
function loadSlide3() {
  // Update year display to show mixed years
  document.getElementById('slide3-year').textContent = `Data Years: 2023-2024`;
  
  // Update download buttons with top 3 partner names
  top3Partners.forEach((partner, index) => {
    const btn = document.querySelector(`[data-partner="${index + 1}"]`);
    if (btn) {
      btn.querySelector('.btn-title').textContent = partner.country;
    }
  });
  
  // Setup download functionality
  setupDownloadButtons();
}

function setupDownloadButtons() {
  const downloadBtns = document.querySelectorAll('.download-btn');
  downloadBtns.forEach((btn, index) => {
    // Remove existing listeners to prevent duplicates
    btn.replaceWith(btn.cloneNode(true));
    
    // Add new listener
    const newBtn = document.querySelector(`[data-partner="${index + 1}"]`);
    newBtn.addEventListener('click', () => {
      generateReport(top3Partners[index]);
    });
  });
}

function generateReport(partner) {
  // Generate comprehensive report for the partner
  const reportContent = generateReportContent(partner);
  
  // Create and download file
  const blob = new Blob([reportContent], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Morocco_Phosphate_Export_Report_${partner.country.replace(/\s+/g, '_')}_${selectedYear}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

function generateReportContent(partner) {
  const report = [];
  
  // Calculate trade statistics
  const tradeStats = calculateTradeStats(partner);
  
  // 1. TITLE
  report.push('='.repeat(60));
  report.push(`Morocco Phosphate Export Partner Report — ${partner.country}`);
  report.push(`2023-2024 • Rank #${top3Partners.indexOf(partner) + 1} Partner`);
  report.push('='.repeat(60));
  report.push('');
  
  // 2. EXECUTIVE SUMMARY
  report.push('EXECUTIVE SUMMARY');
  report.push('-'.repeat(30));
  report.push(generateExecutiveSummary(partner, tradeStats));
  report.push('');
  
  // 3. TRADE OVERVIEW
  report.push('TRADE OVERVIEW');
  report.push('-'.repeat(30));
  report.push(`Total Export Value: $${formatUSD(tradeStats.totalValue)}`);
  report.push(`Total Quantity: ${formatTonnes(tradeStats.totalQuantity)} tonnes`);
  report.push(`Product Categories: ${tradeStats.categoryCount}`);
  report.push('');
  
  // 4. CATEGORY BREAKDOWN
  report.push('CATEGORY BREAKDOWN');
  report.push('-'.repeat(30));
  tradeStats.categories.forEach(cat => {
    report.push(`${cat.name} (${cat.year}):`);
    report.push(`  Export Value: $${formatUSD(cat.value)}`);
    report.push(`  Share: ${cat.share}%`);
    if (cat.quantity) {
      report.push(`  Quantity: ${formatTonnes(cat.quantity)} tonnes`);
    }
    report.push('');
  });
  
  // 5. MARKET INTELLIGENCE
  report.push('MARKET INTELLIGENCE');
  report.push('-'.repeat(30));
  report.push(generateMarketIntelligence(partner, tradeStats));
  report.push('');
  
  // 6. DATA SOURCES & METHODOLOGY
  report.push('DATA SOURCES & METHODOLOGY');
  report.push('-'.repeat(30));
  report.push('• World Bank WITS (UN Comtrade) - Official trade statistics');
  report.push('• USGS Mineral Commodity Summaries - Global phosphate context');
  report.push('• OCP Group operations data - Morocco production capacity');
  report.push('• African Development Bank - Regional market analysis');
  report.push('');
  report.push('Methodology: Data aggregated across all phosphate product');
  report.push('categories (2023-2024). EU aggregate values excluded from partner rankings.');
  report.push('Values converted to USD for consistency across reporting periods.');
  report.push('');
  
  report.push('='.repeat(60));
  report.push(`Report generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
  report.push('Computational Trade Intelligence • Morocco Phosphate Export Analysis');
  report.push('='.repeat(60));
  
  return report.join('\n');
}

function calculateTradeStats(partner) {
  let totalValue = 0;
  let totalQuantity = 0;
  const categories = [];
  
  Object.values(TRADE_DATA.exports).forEach(category => {
    // Include all export categories regardless of year
    const partnerData = category.partners.find(p => p.country === partner.country);
    if (partnerData) {
      const value = partnerData.valueUSD || (partnerData.valueKUSD ? partnerData.valueKUSD * 1000 : 0);
      const quantity = partnerData.qtyKg ? partnerData.qtyKg / 1000 : null;
      
      const validValue = isNaN(value) ? 0 : value;
      const validQuantity = quantity && !isNaN(quantity) ? quantity : null;
      
      totalValue += validValue;
      if (validQuantity !== null) totalQuantity += validQuantity;
      
      categories.push({
        name: category.label,
        value: validValue,
        quantity: validQuantity,
        share: 0, // Will calculate below
        year: category.year // Include year for context
      });
    }
  });
  
  // Calculate shares
  categories.forEach(cat => {
    cat.share = totalValue > 0 ? (cat.value / totalValue * 100).toFixed(1) : '0.0';
  });
  
  // Sort by value
  categories.sort((a, b) => b.value - a.value);
  
  return {
    totalValue: isNaN(totalValue) ? 0 : totalValue,
    totalQuantity: isNaN(totalQuantity) ? 0 : totalQuantity,
    categoryCount: categories.length,
    categories
  };
}

function generateExecutiveSummary(partner, tradeStats) {
  const dominantCategory = tradeStats.categories[0];
  const rank = top3Partners.indexOf(partner) + 1;
  
  let summary = `This report analyzes Morocco's phosphate exports to ${partner.country} across 2023-2024, where ${partner.country} ranks #${rank} among export partners with a total value of $${formatUSD(tradeStats.totalValue)}. `;
  
  if (dominantCategory) {
    summary += `Trade is primarily driven by ${dominantCategory.name.toLowerCase()} (${dominantCategory.year}), `;
    
    // Add intelligence about concentration
    if (dominantCategory.share > 70) {
      summary += 'indicating a highly concentrated trade relationship focused on this dominant product category. ';
    } else if (dominantCategory.share > 50) {
      summary += 'showing strong concentration while maintaining secondary product streams. ';
    } else {
      summary += 'demonstrating a diversified trade relationship across multiple phosphate products. ';
    }
  }
  
  // Add market positioning insight
  if (rank === 1) {
    summary += `As Morocco's premier phosphate export partner, ${partner.country} represents a critical market for Moroccan phosphate exports.`;
  } else if (rank === 2) {
    summary += `${partner.country} maintains a strategic position as Morocco's second-largest phosphate export market.`;
  } else {
    summary += `${partner.country} holds a significant position among Morocco's top phosphate export partners.`;
  }
  
  return summary;
}

function generateMarketIntelligence(partner, tradeStats) {
  const insights = [];
  
  // Product mix analysis
  const dominantCategory = tradeStats.categories[0];
  if (dominantCategory) {
    if (dominantCategory.name.includes('Fertilizer')) {
      insights.push(`• Strong fertilizer demand indicates large-scale agricultural sector and food security priorities.`);
    } else if (dominantCategory.name.includes('Phosphoric acid')) {
      insights.push(`• High phosphoric acid imports suggest significant domestic fertilizer manufacturing capacity.`);
    } else if (dominantCategory.name.includes('Rock')) {
      insights.push(`• Phosphate rock imports indicate domestic processing capabilities and value-added production.`);
    }
  }
  
  // Trade relationship characterization
  if (tradeStats.categoryCount === 1) {
    insights.push(`• Specialized trade relationship focused on single product category.`);
  } else if (tradeStats.categoryCount === 2) {
    insights.push(`• Moderately diversified trade relationship across two product categories.`);
  } else {
    insights.push(`• Highly diversified trade relationship spanning multiple phosphate product categories.`);
  }
  
  // Market scale assessment
  if (tradeStats.totalValue > 500000000) {
    insights.push(`• High-value trade relationship exceeding $500 million annually.`);
  } else if (tradeStats.totalValue > 100000000) {
    insights.push(`• Significant trade relationship exceeding $100 million annually.`);
  } else {
    insights.push(`• Notable trade relationship with substantial room for growth.`);
  }
  
  // Geographic/logistics insight
  insights.push(`• Trade flows supported by Morocco's strategic Atlantic export hubs at Jorf Lasfar and Safi.`);
  
  return insights.join('\n');
}

/* ===============================
   PARTNER CENTROIDS (fallback, approximate)
   (prevents "random island" placement)
   ========================================== */
const PARTNER_CENTROIDS = {
  "Australia": [-25.0, 133.0],
  "Canada": [56.0, -106.0],
  "Argentina": [-38.0, -64.0],
  "United States": [39.0, -98.0],
  "Paraguay": [-23.4, -58.4],
  "Uruguay": [-32.8, -56.0],
  "Namibia": [-22.6, 17.1],
  "Slovenia": [46.1, 14.9],
  "Chile": [-35.7, -71.5],
  "Italy": [42.8, 12.5],
  "Spain": [40.4, -3.7],
  "Lithuania": [55.3, 23.9],
  "Latvia": [56.9, 24.6],
  "Bulgaria": [42.7, 25.5],
  "Zambia": [-13.1, 27.8],
  "Poland": [52.1, 19.4],
  "France": [46.2, 2.2],
  "Turkey": [39.0, 35.0],
  "Japan": [36.2, 138.2],
  "Ukraine": [49.0, 31.0],
  "Portugal": [39.6, -8.0],
  "Colombia": [4.5, -74.0],
  "Romania": [45.9, 24.9],
  "Belgium": [50.6, 4.7],
  "Bolivia": [-16.3, -63.6],
  "Angola": [-12.3, 17.6],
  "Sweden": [62.0, 15.0],
  "Germany": [51.2, 10.4],
  "Slovak Republic": [48.7, 19.7],
  "Croatia": [45.1, 15.2],
  "Nicaragua": [12.9, -85.0],
  "Czech Republic": [49.8, 15.5],
  "Guatemala": [15.8, -90.2],
  "Dominican Republic": [18.7, -70.2],
  "Malawi": [-13.2, 34.3],
  "Estonia": [58.6, 25.0],
  "Lebanon": [33.9, 35.8],
  "United Kingdom": [55.4, -3.4],
  "Moldova": [47.2, 28.4],
  "Peru": [-9.2, -75.0],
  "India": [22.0, 79.0],
  "Malaysia": [4.2, 102.0],
  "Ecuador": [-1.4, -78.4],
  "Azerbaijan": [40.1, 47.5],
  "Mauritania": [20.3, -10.3],
  "Saudi Arabia": [23.9, 45.1],
  "North Macedonia": [41.6, 21.7],
  "Bosnia and Herzegovina": [44.2, 17.7],
  "Senegal": [14.5, -14.4],
  "China": [35.0, 103.0],
  "Thailand": [15.8, 101.0],
  "Mexico": [23.6, -102.5],
  "Austria": [47.5, 14.5],
  "Israel": [31.0, 35.0],
  "Netherlands": [52.2, 5.3],
  // New countries from trade_flows.json
  "Pakistan": [30.4, 69.3],
  "Norway": [60.5, 8.5],
  "New Zealand": [-40.9, 174.9],
  "Indonesia": [-0.8, 113.9]
};

/* Name standardization for centroid lookup */
const NAME_FIX = {
  "Slovak Republic": "Slovakia",
  "Czech Republic": "Czechia",
  "Bosnia and Herzegovina": "Bosnia and Herz."
};

/* ===============================
   MOROCCO SITES (all inside Morocco)
   =============================== */
const MOROCCO_SITES = [
  { name:"Khouribga", type:"mine", lat:32.886, lng:-6.906, note:"Major phosphate basin (OCP)."},
  { name:"Benguerir", type:"mine", lat:32.238, lng:-7.953, note:"Gantour region operations."},
  { name:"Youssoufia", type:"mine", lat:32.246, lng:-8.529, note:"Gantour region operations."},
  { name:"Jorf Lasfar", type:"hub", lat:33.138, lng:-8.616, note:"Coastal industrial hub / export platform."},
  { name:"Safi", type:"hub", lat:32.299, lng:-9.237, note:"Coastal processing / exports."},
  { name:"Bou Craa", type:"mine", lat:26.313, lng:-13.007, note:"Southern phosphate operations (Phosboucraa)."},
  { name:"Laâyoune", type:"logistics", lat:27.153, lng:-13.203, note:"Southern logistics / export node."}
];

// Use Jorf Lasfar as the clean origin/termination point for flows:
const MOROCCO_FLOW_HUB = { lat:33.138, lng:-8.616 };

/* ===============================
   SHARED DRAWING FUNCTIONS
   =============================== */
function drawMoroccoSites(targetLayer) {
  MOROCCO_SITES.forEach(site => {
    const color = site.type === "mine" ? cssVar("--col-mine") :
                  site.type === "hub" ? cssVar("--col-hub") :
                  cssVar("--col-logistics");

    const marker = makeCircleMarker(site.lat, site.lng, color)
      .bindTooltip(`<strong>${site.name}</strong><br/>${site.note}`, { className:"customTip", direction:"top" });

    targetLayer.addLayer(marker);
  });
}

function drawExportFlow(targetMap, partner, categoryLabel) {
  const end = partnerLatLng(partner.country);
  if (!end) return;

  // Partner dot
  const partnerMarker = makeCircleMarker(end.lat, end.lng, cssVar("--col-partner"));
  const value = partner.valueUSD || (partner.valueKUSD ? partner.valueKUSD * 1000 : 0);
  const validValue = isNaN(value) ? 0 : value;
  
  partnerMarker.bindTooltip(
    `<strong>${partner.country}</strong><br/>Exports to ${categoryLabel}<br/>$${formatUSD(validValue)} (2023-2024)`,
    { className:"customTip", direction:"top" }
  );
  targetMap.partnersLayer.addLayer(partnerMarker);

  // Flow arc
  const pts = bezierArcPoints(MOROCCO_FLOW_HUB, end, 0.22, 70);
  
  const line = L.polyline(pts, {
    color: cssVar("--col-export"),
    weight: 2,
    opacity: 0.6,
    dashArray: null
  });
  
  targetMap.flowsLayer.addLayer(line);
  
  // Arrowhead
  const last = pts[pts.length-1];
  const prev = pts[pts.length-6] || pts[pts.length-2];
  const angle = Math.atan2(last[0]-prev[0], last[1]-prev[1]);
  
  const arrow = addArrowHead(L.latLng(last[0], last[1]), angle - Math.PI/2, cssVar("--col-export"));
  targetMap.flowsLayer.addLayer(arrow);
}

function drawTop3Flow(targetMap, partner, rank) {
  const end = partnerLatLng(partner.country);
  if (!end) return;

  // Enhanced partner dot for top 3
  const partnerMarker = makeCircleMarker(end.lat, end.lng, cssVar("--col-partner"));
  
  partnerMarker.bindTooltip(
    `<strong>${partner.country}</strong><br/>Rank #${rank} Partner<br/>$${formatUSD(partner.value)} (${partner.share}%)`,
    { className:"customTip", direction:"top" }
  );
  targetMap.partnersLayer.addLayer(partnerMarker);

  // Enhanced flow arc for top 3
  const pts = bezierArcPoints(MOROCCO_FLOW_HUB, end, 0.25, 80);
  
  // Different colors for top 3
  const colors = ["#2f8f5b", "#6b5bff", "#ff6b35"];
  const color = colors[rank - 1];
  
  const line = L.polyline(pts, {
    color: color,
    weight: 4,
    opacity: 0.8,
    dashArray: null
  });
  
  targetMap.flowsLayer.addLayer(line);
  
  // Enhanced arrowhead
  const last = pts[pts.length-1];
  const prev = pts[pts.length-6] || pts[pts.length-2];
  const angle = Math.atan2(last[0]-prev[0], last[1]-prev[1]);
  
  const arrow = addArrowHead(L.latLng(last[0], last[1]), angle - Math.PI/2, color);
  targetMap.flowsLayer.addLayer(arrow);
}

/* ===============================
   MARKERS & FLOW FUNCTIONS
   =============================== */

function makeCircleMarker(lat, lng, color){
  return L.circleMarker([lat,lng], {
    radius: 6,
    color: "rgba(0,0,0,0.10)",
    weight: 2,
    fillColor: color,
    fillOpacity: 0.95
  });
}

function bezierArcPoints(from, to, bend = 0.22, steps = 70){
  const x1 = from.lng, y1 = from.lat;
  const x2 = to.lng, y2 = to.lat;

  // Midpoint
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  // Perpendicular offset
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx*dx + dy*dy) || 1;

  // normalized perpendicular
  const px = -dy / dist;
  const py = dx / dist;

  // scale bend based on distance (clamped)
  const bendScale = Math.max(2, Math.min(12, dist * 0.6)) * bend;

  const cx = mx + px * bendScale;
  const cy = my + py * bendScale;

  const pts = [];
  for (let i=0;i<=steps;i++){
    const t = i/steps;
    // Quadratic bezier
    const xt = (1-t)*(1-t)*x1 + 2*(1-t)*t*cx + t*t*x2;
    const yt = (1-t)*(1-t)*y1 + 2*(1-t)*t*cy + t*t*y2;
    pts.push([yt, xt]); // Leaflet is [lat,lng]
  }
  return pts;
}


function cssVar(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function addArrowHead(endLatLng, angleRad, color){
  // A tiny triangle using a divIcon, rotated by angle.
  const deg = (angleRad * 180/Math.PI);
  const html = `<div class="arrowHead" style="transform: rotate(${deg}deg); border-bottom-color:${color};"></div>`;
  const icon = L.divIcon({ className: "arrowWrap", html, iconSize:[14,14], iconAnchor:[7,7] });
  return L.marker(endLatLng, { icon, interactive:false });
}

// Arrow CSS injected once
(function injectArrowCSS(){
  const css = `
    .arrowWrap{ background: transparent; }
    .arrowHead{
      width: 0; height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-bottom: 12px solid ${cssVar("--col-export")};
      opacity: 0.9;
    }
  `;
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);
})();

function formatUSD(n){
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function formatPct(n){
  if (n < 0.01) return "<0.01%";
  return `${n.toFixed(2)}%`;
}
function formatTonnes(n){
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function partnerLatLng(country){
  const key = NAME_FIX[country] || country;
  const c = PARTNER_CENTROIDS[key];
  if (!c) return null;
  return L.latLng(c[0], c[1]);
}
