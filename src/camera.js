import cancelImage from "./x-circle.svg";
import pauseImage from "./pause-btn.svg";
import playImage from "./play-btn.svg";
import saveImage from "./save.svg";

const CANCEL_INPUT_ID = "cancel";
const PAUSE_INPUT_ID = "pause-pause";
const SAVE_INPUT_ID = "save";

const reader = new FileReader();

let width = 640; // We will scale the photo width to this
let height = 0; // This will be computed based on the input stream
let streaming = false; //flag for a 1st-time init
let canvasImgBlob = null;

const video = document.getElementById("video");
const photo = document.getElementById("photo");
// const canvas = document.getElementById("canvas");

//start video playback
navigator.mediaDevices
  .getUserMedia({ video: true, audio: false })
  .then((stream) => {
    video.srcObject = stream;
    video.play().then((event) => {
      const pauseButton = document.getElementById(PAUSE_INPUT_ID);
      pauseButton.removeAttribute("disabled");
      pauseButton.addEventListener("click", takePicture);
    });
  })
  .catch((err) => {
    console.error(`An error occurred: ${err}`);
    const pauseButton = document.getElementById(PAUSE_INPUT_ID);
    pauseButton.setAttribute("disabled", "disabled");
  });

function adjustAspectRations(event) {
  if (!streaming) {
    height = (video.videoHeight / video.videoWidth) * width;
    if (isNaN(height)) {
      height = (width * 3.0) / 4.0;
    }

    video.setAttribute("width", width);
    video.setAttribute("height", height);
    photo.setAttribute("width", width);
    photo.setAttribute("height", height);
    streaming = true;
  }
}

function SaveImageWithLocation() {
  reader.readAsDataURL(canvasImgBlob);
}

function ShowPhoto() {
  video.style.display = "none";
  photo.style.display = "block";

  const pauseButton = document.getElementById(PAUSE_INPUT_ID);
  pauseButton.src = playImage;
  pauseButton.removeEventListener("click", takePicture);
  pauseButton.addEventListener("click", ShowVideo);

  const saveButton = document.getElementById(SAVE_INPUT_ID);
  saveButton.removeAttribute("disabled");
  saveButton.addEventListener("click", SaveImageWithLocation);
}

function ShowVideo() {
  video.style.display = "block";
  photo.style.display = "none";

  const pauseButton = document.getElementById(PAUSE_INPUT_ID);
  pauseButton.src = pauseImage;
  pauseButton.removeEventListener("click", ShowVideo);
  pauseButton.addEventListener("click", takePicture);

  const saveButton = document.getElementById(SAVE_INPUT_ID);
  saveButton.setAttribute("disabled", "disabled");
  saveButton.removeEventListener("click", ShowVideo);
}

function takePicture(event) {
  const videoWidth = video.offsetWidth;
  const videoHeight = video.offsetHeight;
  const canvas = new OffscreenCanvas(videoWidth, videoHeight);
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, width, videoHeight);

  // Füge Koordinaten zum Bild hinzu
  const latitude = getParameterByName("latitude");
  const longitude = getParameterByName("longitude");

  // Zeichne gelben Hintergrund
  const backgroundX = width / 2 - 110;
  const backgroundY = videoHeight - 16;
  const backgroundWidth = 220;
  const backgroundHeight = 16;
  context.fillStyle = "rgba(255, 255, 0, 0.7)";
  context.fillRect(backgroundX, backgroundY, backgroundWidth, backgroundHeight);

  const pictureText = `Latitude: ${latitude} - Longitude: ${longitude}`;
  context.font = "10px Arial";
  context.fillStyle = "black";
  context.textAlign = "center";
  context.textBaseline = "bottom";
  context.fillText(pictureText, width / 2, videoHeight - 2);

  canvas.convertToBlob({ type: "image/jpeg" }).then((blob) => {
    canvasImgBlob = blob;
    const imageData = URL.createObjectURL(blob);
    photo.width = width;
    photo.height = height;
    photo.src = imageData;
  });

  ShowPhoto();
}

function getParameterByName(urlParameterName) {
  const urlParams = new URLSearchParams(window.location.search);
  const urlParam = urlParams.get(urlParameterName);
  return urlParam;
}

function navigateToMap() {
  window.location.href = "./index.html";
}

//further initializations as soon as a video stream appears
video.addEventListener("canplay", adjustAspectRations, false);
photo.style.display = "none";

window.onload = () => {
  const cancelButton = document.getElementById(CANCEL_INPUT_ID);
  const pauseButton = document.getElementById(PAUSE_INPUT_ID);
  const saveButton = document.getElementById(SAVE_INPUT_ID);
  cancelButton.src = cancelImage;
  pauseButton.src = pauseImage;
  saveButton.src = saveImage;
};

const cancelElement = document.getElementById(CANCEL_INPUT_ID);
cancelElement.addEventListener("click", navigateToMap);

reader.onloadend = function () {
  const latitude = getParameterByName("latitude");
  const longitude = getParameterByName("longitude");

  const imageIndex = `${latitude}_${longitude}`;
  localStorage.setItem(imageIndex, reader.result);

  console.log("Image saved!");
  navigateToMap();
};
