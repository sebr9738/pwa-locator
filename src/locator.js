import cameraImage from "./camera.svg";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const markerIcon = new L.Icon.Default({
  iconUrl: marker,
  iconRetinaUrl: marker2x,
  shadowUrl: markerShadow,
});

const COORD_FORMATTER = Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 6,
  maximumFractionDigits: 6,
  minimumIntegerDigits: 3,
  style: "unit",
  unit: "degree",
});
const DIST_FORMATTER = Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  style: "unit",
  unit: "meter",
});
const DEG_FORMATTER = Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  style: "unit",
  unit: "degree",
});

const LOCATION_LEFT_ID = "location-left";
const LOCATION_MIDDLE_ID = "location-middle";
const CAMERA_INPUT_ID = "camera";

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 10000,
  timeout: 5000,
};

//map state
let map;
let ranger;
let geolocation;
let lastKnownPosition;
let watchID;

function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

function configureMap(latLngArray) {
  map = L.map("map").setView(latLngArray, 17);
  if (isTouchDevice()) {
    map.removeControl(map.zoomControl);
  }
  map.attributionControl.setPosition("bottomleft");

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  ranger = L.circle(latLngArray, { radius: 20.0 }).addTo(map);

  displayImagesOnMap();
}

function displayImagesOnMap() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    // Überprüfe, ob der localStorage-Eintrag Koordinaten im Index hat
    const coordinates = key.split("_");
    if (coordinates.length === 2) {
      const latitude = parseFloat(coordinates[0]);
      const longitude = parseFloat(coordinates[1]);

      // Füge einen Marker auf der Karte hinzu
      if (!isNaN(latitude) && !isNaN(longitude)) {
        const marker = L.marker([latitude, longitude], {
          icon: markerIcon,
        }).addTo(map);

        // Du kannst hier auch weitere Anpassungen am Marker vornehmen
        // z.B. Popup mit Bild oder Tooltip hinzufügen
        const imageUrl = localStorage.getItem(key);
        if (imageUrl) {
          marker.bindPopup(`<img src="${imageUrl}" alt="Marker Image" class="marker-popup-icon">`, {
            className: 'marker-popup'
          });
        }
      }
    }
  }
}

function updatePosition(position) {
  const locatorLeftDiv = document.getElementById(LOCATION_LEFT_ID);
  const locatorMiddleDiv = document.getElementById(LOCATION_MIDDLE_ID);

  const coords = position.coords;
  console.debug(`got new coordinates: ${coords}`);
  locatorLeftDiv.innerHTML = `
        <dl>
            <dt>LAT</dt>
            <dd>${COORD_FORMATTER.format(coords.latitude)}</dd>
            <dt>LONG</dt>
            <dd>${COORD_FORMATTER.format(coords.longitude)}</dd>
            <dt>ALT</dt>
            <dd>${
              coords.altitude ? DIST_FORMATTER.format(coords.altitude) : "-"
            }</dd>
        </dl>`;
  locatorMiddleDiv.innerHTML = `
        <dl>
            <dt>ACC</dt>
            <dd>${DIST_FORMATTER.format(coords.accuracy)}</dd>
            <dt>HEAD</dt>
            <dd>${
              coords.heading ? DEG_FORMATTER.format(coords.heading) : "-"
            }</dd>
            <dt>SPD</dt>
            <dd>${coords.speed ? DIST_FORMATTER.format(coords.speed) : "-"}</dd>
        </dl>`;
  var ll = [coords.latitude, coords.longitude];

  map.setView(ll);

  ranger.setLatLng(ll);
  ranger.setRadius(coords.accuracy);

  if (position) {
    const cameraElement = document.getElementById("camera");
    cameraElement.removeAttribute("disabled");

    // Speichere die letzte Position
    lastKnownPosition = {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  }
}

function locate(position) {
  //the time at which the location was retrieved
  console.debug(position.timestamp);

  const c = position.coords;
  console.debug(`my position: lat=${c.latitude} lng=${c.longitude}`);
}

function handleErr(err) {
  console.error(err.message);
}

/* setup component */
window.onload = () => {
  const cameraButton = document.getElementById(CAMERA_INPUT_ID);
  const queryParams = new URLSearchParams(window.location.search);

  //setup UI
  cameraButton.src = cameraImage;

  //init leaflet
  configureMap([47.406653, 9.744844]);

  //init footer
  updatePosition({
    coords: {
      latitude: 47.406653,
      longitude: 9.744844,
      altitude: 440,
      accuracy: 40,
      heading: 45,
      speed: 1.8,
    },
  });

  // setup service worker
  const swDisbaled = queryParams.get("service-worker") === "disabled";
  console.debug(
    `query param 'service-worker': ${queryParams.get(
      "service-worker"
    )}, disabled: ${swDisbaled}`
  );
  if (!swDisbaled && "serviceWorker" in navigator) {
    navigator.serviceWorker
      .register(new URL("serviceworker.js", import.meta.url), {
        type: "module",
      })
      .then(() => {
        console.log("Service worker registered!");
      })
      .catch((error) => {
        console.warn("Error registering service worker:");
        console.warn(error);
      });
  }

  if ("geolocation" in navigator) {
    /* geolocation is available */
    geolocation = navigator.geolocation;
    watchID = geolocation.watchPosition(
      updatePosition,
      handleErr,
      GEOLOCATION_OPTIONS
    );
  }
};

window.onbeforeunload = (event) => {
  if (geolocation) {
    geolocation.clearWatch(watchID);
  }
};

// Beispiel, wie du auf die letzte Position zugreifen kannst
function getlastKnownPosition() {
  return lastKnownPosition;
}

// Funktion zum Navigieren zur Kamera-Seite mit lastKnownPosition als Parameter in der URL
function navigateToCamera() {
  const lastPosition = getlastKnownPosition();
  if (lastPosition) {
    const queryString = `?latitude=${lastPosition.latitude}&longitude=${lastPosition.longitude}`;
    window.location.href = `./camera.html${queryString}`;
  } else {
    // Handle the case when there is no lastKnownPosition
    window.location.href = "./camera.html";
  }
}

const cameraElement = document.getElementById("camera");
cameraElement.addEventListener("click", navigateToCamera);
