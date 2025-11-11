/************************************************
 *
 * Leaflet Map Setup
 * Tile Generation
 *
 ************************************************/

import leaflet from "leaflet";

import "leaflet/dist/leaflet.css";
import "./style.css";

import "./_leafletWorkaround.ts";

import luck from "./_luck.ts";

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;

/*--------------------------SETTING UP LEAFLET MAP--------------------------*/

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

const map = leaflet.map(mapDiv, {
  center: CLASSROOM_LATLNG,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

/*--------------------------PLAYER INFORMATION--------------------------*/

const playerMarker = leaflet.marker(CLASSROOM_LATLNG);
playerMarker.addTo(map);

const position = CLASSROOM_LATLNG;
let token: number = 0;
let hasToken: boolean = false;

if (token) console.log("Funny temporary check work around");
if (position) console.log("Funny temporary check work around");

/*--------------------------TILE GENERATION--------------------------*/

function spawnCache(i: number, j: number) {
  // Convert cell numbers into lat/lng bounds
  const origin = CLASSROOM_LATLNG;
  const bounds = leaflet.latLngBounds([
    [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
    [origin.lat + (i + 1) * TILE_DEGREES, origin.lng + (j + 1) * TILE_DEGREES],
  ]);

  // Add a rectangle to the map to represent the cache
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  rect.bindPopup(() => {
    const popUp = document.createElement("div");
    popUp.innerHTML =
      'Token: <span id="value">${pointValue}</span>.</div>< button id = "poke" > PRESS ME </button>';

    //TODO: RANDOMLY SEED TOKEN TO A SPECIFIC VALUE
    let tokenValue = Math.floor(luck([i, j, "initialValue"].toString()) * 100);

    popUp.querySelector<HTMLButtonElement>("#poke")!.addEventListener(
      "click",
      () => {
        //TODO: ADD A POSITION CHECKER
        if (!hasToken) {
          token = tokenValue;
          tokenValue = 0;
          popUp.querySelector<HTMLSpanElement>("#value")!.innerHTML = tokenValue
            .toString();
          hasToken = true;
        } else {
          //TODO: PROPER CAN'T DO THAT MESSAGE
          console.log("Sorry- Temporary can't do that message");
        }
      },
    );
    return popUp;
  });
}

for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    if (luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY) {
      spawnCache(i, j);
    }
  }
}
