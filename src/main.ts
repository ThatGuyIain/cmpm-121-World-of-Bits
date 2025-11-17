/************************************************
 *
 * Data Types
 * Constants
 * Global Variables
 * Leaflet Map Setup
 * Player Information
 * Tile Generation
 * Temporary MISC
 * Main
 *
 ************************************************/

// @deno-types="npm:@types/leaflet"
import Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";

/*--------------------------DATA TYPES--------------------------*/

interface Point {
  x: number;
  y: number;
}

interface Token {
  value: number;
}

interface CellOptions extends Leaflet.PolylineOptions {
  token?: Token;
  centerDist?: Point;
}

/*--------------------------CONSTANTS--------------------------*/

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const CACHE_SPAWN_PROBABILITY = 0.1;
const SEEDEDNUMBER = 131;

/*--------------------------GLOBAL VARIABLES--------------------------*/

const CLASSROOM_LATLNG = Leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

let mapDiv: HTMLDivElement;
let map: Leaflet.Map;
let inventoryDiv: HTMLDivElement;

const cellMarkers = new Map<Leaflet.Rectangle, Leaflet.Marker>();

/*--------------------------SETTING UP LEAFLET MAP--------------------------*/

function createMap(): void {
  mapDiv = document.createElement("div");
  mapDiv.id = "map";
  document.body.append(mapDiv);

  map = Leaflet.map(mapDiv, {
    center: CLASSROOM_LATLNG,
    zoom: GAMEPLAY_ZOOM_LEVEL,
    minZoom: GAMEPLAY_ZOOM_LEVEL,
    maxZoom: GAMEPLAY_ZOOM_LEVEL,
    zoomControl: false,
    scrollWheelZoom: false,
  });

  Leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: GAMEPLAY_ZOOM_LEVEL,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  playerMarker = Leaflet.marker(CLASSROOM_LATLNG);
  playerMarker.bindTooltip("That's you!");
  playerMarker.addTo(map);
}

/*--------------------------PLAYER INFORMATION--------------------------*/

let playerMarker: Leaflet.Marker;
let inventory: Token | null = null;

/*--------------------------TILE GENERATION--------------------------*/

function drawCells(): void {
  const bounds = map.getBounds();
  const south = bounds.getSouth();
  const north = bounds.getNorth();
  const west = bounds.getWest();
  const east = bounds.getEast();

  for (let lat = south; lat <= north; lat += TILE_DEGREES) {
    for (let lng = west; lng <= east; lng += TILE_DEGREES) {
      const seed = `${lat}, ${lng}`;
      if (luck(seed) >= CACHE_SPAWN_PROBABILITY) continue;

      const tileBounds: Leaflet.LatLngBoundsLiteral = [
        [lat, lng],
        [lat + TILE_DEGREES, lng + TILE_DEGREES],
      ];

      const tokenValue = getRandomTokenValue(seed);

      const iconMarker = createIcon(tokenValue, tileBounds);
      const rect = createRectangle(tokenValue, tileBounds);

      cellMarkers.set(rect, iconMarker);
    }
  }
}

function createIcon(
  tokenValue: number,
  tileBoundsLiteral: Leaflet.LatLngBoundsLiteral,
): Leaflet.Marker {
  const tileBounds = Leaflet.latLngBounds(tileBoundsLiteral);
  const centerDist = getDistanceFromCenter(tileBounds);

  const icon = Leaflet.divIcon({
    html: `<p>${tokenValue}</p>`,
    className: "icon",
    iconAnchor: [centerDist.x + 6, centerDist.y + 40],
  });

  const center = tileBounds.getCenter();
  const iconMarker = Leaflet.marker(center, {
    icon: icon,
    interactive: false,
  });

  iconMarker.addTo(map);
  return iconMarker;
}

function createRectangle(
  tokenValue: number,
  tileBoundsLiteral: Leaflet.LatLngBoundsLiteral,
): Leaflet.Rectangle {
  const tileBounds = Leaflet.latLngBounds(tileBoundsLiteral);

  const rectOptions: CellOptions = {
    token: { value: tokenValue },
    centerDist: getDistanceFromCenter(tileBounds),
  };
  const rect = Leaflet.rectangle(tileBounds, rectOptions);

  rect.on("click", function (e) {
    const temp = inventory;
    inventory = e.target.options.token;
    e.target.options.token = temp;

    updateInventoryDisplay();
    updateCellDisplay(e.target, e.target.options.token);
  });

  rect.addTo(map);
  return rect;
}

/*--------------------------TEMPORARY MISC--------------------------*/

function getRandomTokenValue(seed: string): number {
  const randomValue = luck(seed);
  console.log(randomValue);
  if (randomValue <= 0.06) return SEEDEDNUMBER;
  if (randomValue <= 0.09) return (SEEDEDNUMBER * 2);
  return (SEEDEDNUMBER * 4);
}

function getDistanceFromCenter(tilebounds: Leaflet.LatLngBounds): Point {
  const centerLat = tilebounds.getNorth() - tilebounds.getCenter().lat;
  const centerLng = tilebounds.getEast() - tilebounds.getCenter().lng;
  return { x: centerLat, y: centerLng };
}

function updateInventoryDisplay(): void {
  if (inventory == null) inventoryDiv.textContent = "No held tokens.";
  else inventoryDiv.textContent = `Held token: ${inventory.value}`;
}

function updateCellDisplay(
  rect: Leaflet.Rectangle,
  newToken: Token | null,
): void {
  const marker = cellMarkers.get(rect);
  const options = rect.options as CellOptions;

  if (marker && options.centerDist) {
    let icon: Leaflet.DivIcon;

    if (newToken != null) {
      icon = Leaflet.divIcon({
        html: `<p>${newToken.value}</p>`,
        className: "icon",
        iconAnchor: [options.centerDist.x + 6, options.centerDist.y + 40],
      });
    } else {
      icon = Leaflet.divIcon({
        html: `<p> </p>`,
        className: "icon",
        iconAnchor: [options.centerDist.x + 6, options.centerDist.y + 40],
      });
    }

    marker.setIcon(icon);
  }
}

/*--------------------------MAIN--------------------------*/

function main(): void {
  createMap();
  drawCells();

  inventoryDiv = document.createElement("div");
  inventoryDiv.id = "statusPanel";
  inventoryDiv.textContent = "No held tokens.";
  document.body.append(inventoryDiv);
}

main();
