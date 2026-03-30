/* ===============================
   LOAD EXTERNAL TRADE DATA
   =============================== */
let TRADE_DATA = {};

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
      },
      imports: {
        specialty: {
          label: "Specialty phosphates",
          year: data.specialty_imports.year,
          partners: data.specialty_imports.rows.map(row => ({
            country: row.partner,
            valueUSD: row.value_usd,
            qtyKg: row.quantity_kg
          }))
        }
      }
    };
    
    // Initialize map after data loads
    initializeApp();
  })
  .catch(error => {
    console.error('Error loading trade data:', error);
    // Fallback to basic initialization
    initializeApp();
  });

function initializeApp() {
  rebuildCategories();
  drawSites();
  render();
  map.setView([31.8, -6.0], 3);
}

/* ==========================================
   PARTNER CENTROIDS (fallback, approximate)
   (prevents "random island" placement)
   ========================================== */
// Only needed if Natural Earth fetch is blocked.
// These are approximate country centroids (lat, lng).
const PARTNER_CENTROIDS = {
  "Brazil": [-10.0, -55.0],
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
   LEAFLET SETUP
   =============================== */
const map = L.map("map", { zoomControl: true }).setView([31.8, -6.0], 4);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const sitesLayer = L.layerGroup().addTo(map);
const partnersLayer = L.layerGroup().addTo(map);
const flowsLayer = L.layerGroup().addTo(map);
const domesticLayer = L.layerGroup().addTo(map);

// Domestic infrastructure links within Morocco
const DOMESTIC_LINKS = [
  // Gantour basin to Safi
  { from:"Benguerir", to:"Safi", kind:"rail_or_haul", label:"Domestic link: Gantour → Safi" },
  { from:"Youssoufia", to:"Safi", kind:"rail_or_haul", label:"Domestic link: Gantour → Safi" },

  // Khouribga to Jorf Lasfar via slurry pipeline
  { from:"Khouribga", to:"Jorf Lasfar", kind:"slurry_pipeline", label:"Slurry pipeline: Khouribga → Jorf Lasfar" },

  // Bou Craa to Laâyoune via conveyor
  { from:"Bou Craa", to:"Laâyoune", kind:"conveyor", label:"Conveyor: Bou Craa → Laâyoune terminal" }
];

// Domestic link styling
const DOMESTIC_STYLE = {
  rail_or_haul: { weight:2, opacity:0.45, dashArray:"3 7" },
  slurry_pipeline: { weight:3, opacity:0.55, dashArray:null },
  conveyor: { weight:2, opacity:0.50, dashArray:"8 6" }
};

// Build site lookup for domestic links
const siteByName = Object.fromEntries(MOROCCO_SITES.map(s => [s.name, s]));
let moroccoLayer = null;
let moroccoFallbackBox = null;

function cssVar(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* ===============================
   MOROCCO OUTLINE REMOVED
   =============================== */
function loadMoroccoOutline() {
  // Function kept for compatibility but does nothing
}

// Rough centroid from bbox (works without turf)
function roughCentroidFromGeoJSON(feature){
  try{
    const coords = [];
    const geom = feature.geometry;
    if (!geom) return null;

    function pushCoords(arr){
      for (const pt of arr){
        if (typeof pt[0] === "number" && typeof pt[1] === "number"){
          coords.push(pt);
        } else {
          pushCoords(pt);
        }
      }
    }
    pushCoords(geom.coordinates);

    if (!coords.length) return null;

    let minLng=Infinity, maxLng=-Infinity, minLat=Infinity, maxLat=-Infinity;
    for (const [lng, lat] of coords){
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
    return { lat: (minLat+maxLat)/2, lng: (minLng+maxLng)/2 };
  } catch {
    return null;
  }
}

/* ===============================
   MARKERS
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

function drawSites(){
  sitesLayer.clearLayers();

  for (const s of MOROCCO_SITES){
    const color =
      s.type === "mine" ? cssVar("--col-mine") :
      s.type === "hub" ? cssVar("--col-hub") :
      cssVar("--col-logistics");

    const m = makeCircleMarker(s.lat, s.lng, color)
      .bindTooltip(`<strong>${s.name}</strong><br/>${s.note}`, { className:"customTip", direction:"top" });

    sitesLayer.addLayer(m);
  }
}

/* ===============================
   FLOWS: CURVED ARC + arrow marker at end
   =============================== */
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

/* ===============================
   RENDER CURRENT VIEW
   =============================== */
let state = {
  tab: "exports",         // "exports" | "imports"
  categoryKey: "fertilizers",
  metric: "share",        // share | usd | tonnes
  showSites: true,
  showFlows: true,
  showDomestic: true
};

function getCurrentDataset(){
  return TRADE_DATA[state.tab][state.categoryKey];
}

function computeDerived(dataset){
  // Remove EU aggregate before computing totals
  const filteredPartners = dataset.partners.filter(p => p.country !== "European Union");
  
  const rows = filteredPartners.map(p => {
    // Handle both valueUSD and valueKUSD formats
    const valueUSD = p.valueUSD || (p.valueKUSD * 1000);
    const tonnes = (p.qtyKg ?? 0) / 1000;
    return { ...p, valueUSD, tonnes };
  });

  const totalUSD = rows.reduce((a,r)=>a+r.valueUSD, 0);
  const totalTonnes = rows.reduce((a,r)=>a+r.tonnes, 0);

  rows.forEach(r => r.sharePct = totalUSD ? (r.valueUSD/totalUSD*100) : 0);
  rows.sort((a,b)=>b.sharePct - a.sharePct);

  return { rows, totalUSD, totalTonnes };
}

function partnerLatLng(country){
  const key = NAME_FIX[country] || country;
  const c = PARTNER_CENTROIDS[key];
  if (!c) return null;
  return L.latLng(c[0], c[1]);
}

function clearFlows(){
  flowsLayer.clearLayers();
  partnersLayer.clearLayers();
}

function drawDomesticLinks(){
  domesticLayer.clearLayers();
  
  // Only show domestic links when zoomed in enough
  if (map.getZoom() < 4) return;
  
  if (!state.showDomestic) return;
  
  // Get current category for smart highlighting
  const currentCategory = state.categoryKey;
  
  for (const link of DOMESTIC_LINKS){
    const fromSite = siteByName[link.from];
    const toSite = siteByName[link.to];
    
    if (!fromSite || !toSite) continue;
    
    // Determine if this link should be highlighted based on category
    let isHighlighted = false;
    if (currentCategory === "phosphate_rock") {
      // Highlight mine nodes only
      isHighlighted = fromSite.type === "mine" || toSite.type === "mine";
    } else if (currentCategory === "phosphoric_acid") {
      // Highlight Khouribga → Jorf Lasfar
      isHighlighted = (link.from === "Khouribga" && link.to === "Jorf Lasfar");
    } else if (currentCategory === "fertilizers_bulk") {
      // Highlight Jorf Lasfar and Safi connections
      isHighlighted = link.to === "Jorf Lasfar" || link.to === "Safi";
    }
    // specialty_imports: no highlighting (represents leakage abroad)
    
    const style = DOMESTIC_STYLE[link.kind];
    const weight = isHighlighted ? style.weight + 1 : style.weight;
    const opacity = isHighlighted ? Math.min(style.opacity + 0.2, 1) : style.opacity;
    
    const polyline = L.polyline([
      [fromSite.lat, fromSite.lng],
      [toSite.lat, toSite.lng]
    ], {
      color: "#2E4057",
      weight: weight,
      opacity: opacity,
      dashArray: style.dashArray
    }).addTo(domesticLayer);
    
    polyline.bindTooltip(link.label, {
      permanent: false,
      direction: 'center',
      className: 'domestic-tooltip'
    });
  }
}

function render(){
  // sites
  if (state.showSites) {
    drawSites();
    if (!map.hasLayer(sitesLayer)) map.addLayer(sitesLayer);
  } else {
    if (map.hasLayer(sitesLayer)) map.removeLayer(sitesLayer);
  }

  clearFlows();
  if (!state.showFlows) return;

  const dataset = getCurrentDataset();
  const { rows, totalUSD, totalTonnes } = computeDerived(dataset);

  // Show all partners in current dataset (no filtering)
  const finalRows = rows;

  // Update year hint
  const yearHint = document.getElementById("yearHint");
  yearHint.textContent = `Data year: ${dataset.year} • ${dataset.label}`;

  const exportColor = cssVar("--col-export");
  const importColor = cssVar("--col-import");

  for (const r of finalRows){
    const end = partnerLatLng(r.country);
    if (!end) continue; // Skip "Others" and any missing centroids

    // Partner dot
    const pm = makeCircleMarker(end.lat, end.lng, cssVar("--col-partner"));
    const label = (state.tab === "exports") ? "Exports to" : "Imports from";

    // Tooltip text based on metric and data format
    let metricText = "";
    const hasDetailedData = r.qtyKg !== undefined; // Check if we have detailed breakdown
    
    if (state.metric === "share"){
      metricText = `${formatPct(r.sharePct)} of this category`;
    } else if (state.metric === "usd"){
      metricText = `$${formatUSD(r.valueUSD)}`;
    } else {
      if (hasDetailedData) {
        metricText = `${formatTonnes(r.tonnes)} tonnes`;
      } else {
        metricText = "Exact subcategory values not separated in trade reporting";
      }
    }

    pm.bindTooltip(
      `<strong>${r.country}</strong><br/>${label} — ${metricText} (${dataset.year})`,
      { className:"customTip", direction:"top" }
    );
    partnersLayer.addLayer(pm);

    // Flow arc
    const from = (state.tab === "exports")
      ? { lat: MOROCCO_FLOW_HUB.lat, lng: MOROCCO_FLOW_HUB.lng }
      : { lat: end.lat, lng: end.lng };

    const to = (state.tab === "exports")
      ? { lat: end.lat, lng: end.lng }
      : { lat: MOROCCO_FLOW_HUB.lat, lng: MOROCCO_FLOW_HUB.lng };

    const pts = bezierArcPoints(from, to, 0.22, 70);

    const color = (state.tab === "exports") ? exportColor : importColor;
    const dash = (state.tab === "exports") ? null : "8 8";

    const line = L.polyline(pts, {
      color,
      weight: 3,
      opacity: 0.75,
      dashArray: dash
    });

    flowsLayer.addLayer(line);

    // Arrowhead at end
    const last = pts[pts.length-1];
    const prev = pts[pts.length-6] || pts[pts.length-2];
    const angle = Math.atan2(last[0]-prev[0], last[1]-prev[1]); // lat/lng delta

    // For imports: arrow points toward Morocco (end at Morocco hub)
    const arrowPos = L.latLng(last[0], last[1]);

    const arrow = addArrowHead(arrowPos, angle - Math.PI/2, color);
    flowsLayer.addLayer(arrow);
  }
  
  // Draw domestic infrastructure links
  drawDomesticLinks();
}

/* ===============================
   UI WIRING
   =============================== */
const tabs = Array.from(document.querySelectorAll(".tab"));
const categorySelect = document.getElementById("categorySelect");
const metricSelect = document.getElementById("metricSelect");
const toggleSites = document.getElementById("toggleSites");
const toggleFlows = document.getElementById("toggleFlows");
const toggleDomestic = document.getElementById("toggleDomestic");

// Tab click
tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.tab = btn.dataset.tab;

    // Rebuild category dropdown based on tab
    rebuildCategories();
    render();
  });
});

function rebuildCategories(){
  categorySelect.innerHTML = "";
  const cats = Object.keys(TRADE_DATA[state.tab]);
  
  // Reorder categories: fertilizers first for exports
  let orderedCats = [...cats];
  if (state.tab === "exports") {
    // Move fertilizers_bulk to first position if it exists
    const fertIndex = orderedCats.indexOf("fertilizers_bulk");
    if (fertIndex !== -1) {
      orderedCats.splice(fertIndex, 1);
      orderedCats.unshift("fertilizers_bulk");
    }
  }
  
  for (const key of orderedCats){
    const ds = TRADE_DATA[state.tab][key];
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = ds.label;
    categorySelect.appendChild(opt);
  }

  // choose sensible default
  state.categoryKey = orderedCats[0];
  categorySelect.value = state.categoryKey;
}

categorySelect.addEventListener("change", () => {
  state.categoryKey = categorySelect.value;
  render();
});

metricSelect.addEventListener("change", () => {
  state.metric = metricSelect.value;
  render();
});

toggleSites.addEventListener("change", () => {
  state.showSites = toggleSites.checked;
  render();
});

toggleFlows.addEventListener("change", () => {
  state.showFlows = toggleFlows.checked;
  render();
});

toggleDomestic.addEventListener("change", () => {
  state.showDomestic = toggleDomestic.checked;
  render();
});

// Sources toggle
const sourcesToggle = document.getElementById("sourcesToggle");
const sourcesPanel = document.getElementById("sourcesPanel");
const sourcesClose = document.getElementById("sourcesClose");

sourcesToggle.addEventListener("click", () => {
  sourcesPanel.classList.toggle("hidden");
});
sourcesClose.addEventListener("click", () => {
  sourcesPanel.classList.add("hidden");
});

/* ===============================
   INIT
   =============================== */
// Map initialization is now handled by initializeApp() after data loads
