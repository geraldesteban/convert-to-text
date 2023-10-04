"use strict";

const { createWorker, createScheduler } = Tesseract;
const scheduler = createScheduler();
const messages = document.getElementById("messages");
const videoUpload = document.getElementById("video-upload");
const convertedText = document.getElementById("converted-text");
let timerId = null;
let videoText = ""; // Store the text from the video.

const addMessage = (m, bold) => {
  let msg = `<p>${m}</p>`;
  if (bold) {
    msg = `<p class="bold">${m}</p>`;
  }
  messages.innerHTML += msg; // Append the newly recognized text
  messages.scrollTop = messages.scrollHeight;
};

const doOCR = async () => {
  const video = document.createElement("video");
  video.width = 640;
  video.height = 360;
  video.crossOrigin = "anonymous";

  const c = document.createElement("canvas");
  c.width = video.width;
  c.height = video.height;

  const file = videoUpload.files[0];
  if (file) {
    const objectURL = URL.createObjectURL(file);
    video.src = objectURL;
    video.controls = true;

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

      addMessage("Video processing complete.");
    });

    document.getElementById("root").appendChild(video);
    addMessage("Video uploaded. You can now play the video.");
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
