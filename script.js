"use strict";

/* Change UI */
const changeImage = document.querySelector(".change-image");
const changeVideo = document.querySelector(".change-video");
const convertVideo = document.querySelector(".convert-video");
const convertImage = document.querySelector(".convert-image");

convertVideo.style.display = "none";
convertImage.style.display = "block";

changeVideo.addEventListener("click", () => {
  convertVideo.style.display = "block";
  convertImage.style.display = "none";
});

changeImage.addEventListener("click", () => {
  convertVideo.style.display = "none";
  convertImage.style.display = "block";
});

/* Image to Text Converter Functionality */
const imageUpload = document.getElementById("image-upload");
const imageConvertedText = document.getElementById("image-converted-text");

const doImageOCR = async () => {
  const file = imageUpload.files[0];
  if (file) {
    try {
      const objectURL = URL.createObjectURL(file);
      const img = new Image();

      // Set the width and height of the image to match the video dimensions.
      img.width = 640;
      img.height = 360;

      img.src = objectURL;
      img.crossOrigin = "anonymous";

      // Remove the previously displayed image and clear the converted text.
      while (imageConvertedText.firstChild) {
        imageConvertedText.removeChild(imageConvertedText.firstChild);
      }

      img.addEventListener("load", async () => {
        try {
          // Use Tesseract.js to perform OCR on the loaded image.
          const {
            data: { text },
          } = await Tesseract.recognize(img);

          // Display the converted text in the "image-converted-text" element.
          imageConvertedText.innerHTML = `<b>${text}</b>`;
        } catch (error) {
          console.error(error);
        }
      });

      // Remove the previously displayed image.
      const previousImage = document
        .getElementById("image-root")
        .querySelector("img");
      if (previousImage) {
        previousImage.remove();
      }

      document.getElementById("image-root").appendChild(img);
    } catch (error) {
      console.error(error);
    }
  }
};

imageUpload.addEventListener("change", doImageOCR);

/* Video to Text Converter Functionality */
const { createWorker, createScheduler } = Tesseract;
const scheduler = createScheduler();
const messages = document.getElementById("video-messages");
const videoUpload = document.getElementById("video-upload");
const convertedText = document.getElementById("video-converted-text");
let timerId = null;
let videoText = ""; // Store the text from the video.
let currentVideoElement = null; // Track the currently displayed video element.

const addMessage = (m, bold) => {
  let msg = `<p>${m}</p>`;
  if (bold) {
    msg = `<p class="bold">${m}</p>`;
  }
  messages.innerHTML += msg; // Append the newly recognized text
  messages.scrollTop = messages.scrollHeight;
};

const doOCR = async () => {
  // Check if there is a currently displayed video element and remove it.
  if (currentVideoElement) {
    currentVideoElement.remove();
  }

  const video = document.createElement("video");
  video.width = 640;
  video.height = 360;
  video.crossOrigin = "anonymous";
  video.autoplay = true; // Add autoplay attribute.

  const c = document.createElement("canvas");
  c.width = video.width;
  c.height = video.height;

  const file = videoUpload.files[0];
  if (file) {
    const objectURL = URL.createObjectURL(file);
    video.src = objectURL;
    video.controls = true;
    currentVideoElement = video; // Set the current video element.

    video.addEventListener("play", () => {
      timerId = setInterval(async () => {
        c.getContext("2d").drawImage(video, 0, 0, video.width, video.height);
        const {
          data: { text },
        } = await scheduler.addJob("recognize", c);

        // Filter out unwanted characters (e.g., non-alphanumeric characters)
        const filteredText = text.replace(/[^a-zA-Z0-9\s]/g, "");

        // Store the text from the video.
        videoText += filteredText;

        // Append the filtered text without removing the previous content.
        addMessage(filteredText);
      }, 1000);
    });

    video.addEventListener("pause", () => {
      clearInterval(timerId);

      // Set the text from the video in the converted-text div.
      convertedText.textContent = videoText;

      addMessage("Video processing complete.", true); // Display this message in bold.
    });

    document.getElementById("video-root").appendChild(video); // Use the correct container ID
    addMessage("Video uploaded. You can now play the video.", true); // Display this message in bold.
  }
};

videoUpload.addEventListener("change", doOCR);

(async () => {
  for (let i = 0; i < 4; i++) {
    const worker = createWorker();
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    scheduler.addWorker(worker);
  }
})();
