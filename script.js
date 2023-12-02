"use strict";

/* Change UI */
$(document).ready(function () {
  const changeImage = $(".change-image");
  const changeVideo = $(".change-video");
  const changeVoice = $(".change-voice");
  const convertVideo = $(".convert-video");
  const convertImage = $(".convert-image");
  const convertVoice = $(".convert-voice");

  convertVideo.hide();
  convertImage.show();
  convertVoice.hide();

  // Function to update the background when a navigation item is clicked
  const updateBackground = element => {
    // Remove the background styling from all navigation items
    $(".pStyle").removeClass("pointerClicked pointer pointerNotClick");

    // Add the background styling to the clicked navigation item
    element.addClass("pointerClicked pointer");

    // Add pointerNotClick class to all other navigation items except the clicked one
    $(".pStyle").not(element).addClass("pointerNotClick");
  };

  changeImage.click(function () {
    convertImage.show();
    convertVideo.hide();
    convertVoice.hide();
    updateBackground($(this)); // Pass the clicked element to the updateBackground function
  });

  changeVideo.click(function () {
    convertVideo.show();
    convertImage.hide();
    convertVoice.hide();
    updateBackground($(this)); // Pass the clicked element to the updateBackground function
  });

  changeVoice.click(function () {
    convertVoice.show();
    convertImage.hide();
    convertVideo.hide();
    updateBackground($(this)); // Pass the clicked element to the updateBackground function
  });
});

/* Image to Text Converter Functionality */
$(document).ready(function () {
  const imageUpload = $("#image-upload");
  const imageConvertedText = $("#image-converted-text");

  const doImageOCR = async () => {
    const file = imageUpload[0].files[0]; // Use [0] to access the first element in the jQuery object.
    if (file) {
      try {
        const objectURL = URL.createObjectURL(file);
        const img = new Image();

        // Set the width and height of the image to match the video dimensions.
        img.width = 500;
        img.height = 250;

        img.src = objectURL;
        img.crossOrigin = "anonymous";

        // Remove the previously displayed image and clear the converted text.
        imageConvertedText.empty();

        img.addEventListener("load", async () => {
          try {
            // Use Tesseract.js to perform OCR on the loaded image.
            const {
              data: { text },
            } = await Tesseract.recognize(img);

            // Display the converted text in the "image-converted-text" element.
            imageConvertedText.html(`<b>${text}</b>`);
          } catch (error) {
            console.error(error);
          }
        });

        // Remove the previously displayed image.
        const previousImage = $("#image-root img");
        if (previousImage.length) {
          previousImage.remove();
        }

        $("#image-root").append(img);
      } catch (error) {
        console.error(error);
      }
    }
  };

  imageUpload.on("change", doImageOCR);
});

/* Video to Text Converter Functionality */
$(document).ready(function () {
  const scheduler = Tesseract.createScheduler();
  const messages = $("#video-messages");
  const videoUpload = $("#video-upload");
  const convertedText = $("#video-converted-text");
  let timerId = null;
  let videoText = "";
  let currentVideoElement = null;

  const addMessage = (m, bold) => {
    let msg = `<p>${m}</p>`;
    if (bold) {
      msg = `<p class="bold">${m}</p>`;
    }
    messages.append(msg);
    messages.scrollTop(messages[0].scrollHeight);
  };

  const doOCR = async () => {
    if (currentVideoElement) {
      currentVideoElement.remove();
    }

    const video = $("<video>")
      .attr("width", 500)
      .attr("height", 250)
      .attr("crossOrigin", "anonymous")
      .attr("autoplay", true);

    const canvas = $("<canvas>").attr("width", 640).attr("height", 360)[0];

    const file = videoUpload[0].files[0];

    if (file) {
      const objectURL = URL.createObjectURL(file);
      video.attr("src", objectURL).attr("controls", true);
      currentVideoElement = video[0];

      video.on("play", () => {
        timerId = setInterval(async () => {
          canvas
            .getContext("2d")
            .drawImage(video[0], 0, 0, video[0].width, video[0].height);
          const {
            data: { text },
          } = await scheduler.addJob("recognize", canvas);

          const filteredText = text.replace(/[^a-zA-Z0-9\s]/g, "");
          videoText += filteredText;
          addMessage(filteredText);
        }, 1000);
      });

      video.on("pause", () => {
        clearInterval(timerId);
        convertedText.text(videoText);
        addMessage("Video processing complete.", true);
      });

      $("#video-root").append(video);
      addMessage("Video uploaded. You can now play the video.", true);
    }
  };

  videoUpload.on("change", doOCR);

  (async () => {
    for (let i = 0; i < 4; i++) {
      const worker = Tesseract.createWorker();
      await worker.load();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      scheduler.addWorker(worker);
    }
  })();
});

/* Voice to Text Converter Functionality */

$(document).ready(function () {
  let recognition;

  // Check if the browser supports the Web Speech API
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    const startButton = $("#startButton");
    const stopButton = $("#stopButton");
    const transcriptElement = $("#transcript");

    // Set the recognition language (optional)
    recognition.lang = "en-US";

    // When speech recognition is successful, this event is triggered
    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript.toLowerCase();
      transcriptElement.text("Voice text: " + transcript);

      // Check for specific keywords and perform actions
      if (transcript.includes("youtube")) {
        window.open("https://www.youtube.com", "_blank");
      } else if (transcript.includes("wikipedia")) {
        window.open("https://www.wikipedia.org", "_blank");
      } else if (transcript.includes("google")) {
        window.open("https://www.google.com", "_blank");
      } else if (transcript.includes("stackoverflow")) {
        window.open("https://stackoverflow.com", "_blank");
      } else if (transcript.includes("gpt")) {
        window.open("https://chat.openai.com/", "_blank");
      } else if (transcript.includes("ms teams")) {
        window.open("https://teams.microsoft.com/", "_blank");
      }
      // Add more keywords and actions as needed
    };

    // When an error occurs, this event is triggered
    recognition.onerror = function (event) {
      console.error("Speech recognition error:", event.error);
    };

    // Start listening when the "Start Listening" button is clicked
    startButton.on("click", function () {
      recognition.start();
      startButton.prop("disabled", true);
      stopButton.css("display", "inline-block");
    });

    // Stop listening when the "Stop Listening" button is clicked
    stopButton.on("click", function () {
      recognition.stop();
      startButton.prop("disabled", false);
      stopButton.css("display", "none");
    });
  } else {
    console.error("Web Speech API is not supported in this browser");
  }
});
