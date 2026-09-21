const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ------------------------------------
// AUDIO FOLDER
// ------------------------------------

const audioFolder = path.join(__dirname, "audio");

if (!fs.existsSync(audioFolder)) {
  fs.mkdirSync(audioFolder);
}

// Make audio files accessible
app.use("/audio", express.static(audioFolder));

// ------------------------------------
// LANGUAGE CONFIGURATION
// ------------------------------------

const languageConfig = {
  "en-US": {
    male: "en-US-GuyNeural",
    female: "en-US-JennyNeural",
    target: "en",
  },

  "hi-IN": {
    male: "hi-IN-MadhurNeural",
    female: "hi-IN-SwaraNeural",
    target: "hi",
  },

  "gu-IN": {
    male: "gu-IN-NiranjanNeural",
    female: "gu-IN-DhwaniNeural",
    target: "gu",
  },

  "mr-IN": {
    male: "mr-IN-ManoharNeural",
    female: "mr-IN-AarohiNeural",
    target: "mr",
  },

  "es-ES": {
    male: "es-ES-AlvaroNeural",
    female: "es-ES-ElviraNeural",
    target: "es",
  },

  "fr-FR": {
    male: "fr-FR-HenriNeural",
    female: "fr-FR-DeniseNeural",
    target: "fr",
  },

  "de-DE": {
    male: "de-DE-ConradNeural",
    female: "de-DE-KatjaNeural",
    target: "de",
  },
};

// ------------------------------------
// HEALTH CHECK
// ------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Text-to-Speech server is running",
  });
});

// ------------------------------------
// AVAILABLE VOICES
// ------------------------------------

app.get("/api/voices", (req, res) => {
  res.json({
    success: true,
    voices: [
      {
        name: "Female Natural",
        gender: "female",
      },
      {
        name: "Male Natural",
        gender: "male",
      },
    ],
  });
});

// ------------------------------------
// TRANSLATE TEXT
// ------------------------------------

async function translateText(text, targetLanguage) {
  // English does not need translation
  if (targetLanguage === "en") {
    return text;
  }

  const url =
    "https://translate.googleapis.com/translate_a/single" +
    `?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(
      text
    )}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Translation service failed.");
  }

  const data = await response.json();

  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Invalid translation response.");
  }

  return data[0]
    .map((item) => item[0])
    .filter(Boolean)
    .join("");
}

// ------------------------------------
// TEXT TO SPEECH
// ------------------------------------

app.post("/api/tts", async (req, res) => {
  try {
    const { text, language, voice } = req.body;

    // --------------------------------
    // VALIDATE TEXT
    // --------------------------------

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required.",
      });
    }

    // --------------------------------
    // VALIDATE LENGTH
    // --------------------------------

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Text cannot exceed 5000 characters.",
      });
    }

    // --------------------------------
    // VALIDATE LANGUAGE
    // --------------------------------

    if (!languageConfig[language]) {
      return res.status(400).json({
        success: false,
        message: "Unsupported language.",
      });
    }

    // --------------------------------
    // VALIDATE VOICE
    // --------------------------------

    if (!["male", "female"].includes(voice)) {
      return res.status(400).json({
        success: false,
        message: "Invalid voice.",
      });
    }

    const config = languageConfig[language];

    const selectedVoice = config[voice];

    console.log("");
    console.log("--------------------------------");
    console.log("TTS REQUEST");
    console.log("--------------------------------");
    console.log("Language:", language);
    console.log("Gender:", voice);
    console.log("Voice:", selectedVoice);
    console.log("Characters:", text.length);
    console.log("--------------------------------");

    // --------------------------------
    // TRANSLATE TEXT
    // --------------------------------

    console.log("Translating text...");

    const translatedText = await translateText(text, config.target);

    console.log("Translation completed.");
    console.log("Translated text:", translatedText);

    // --------------------------------
    // UNIQUE MP3 FILE
    // --------------------------------

    const filename =
      `speech-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.mp3`;

    const outputPath = path.join(audioFolder, filename);

    // --------------------------------
    // EDGE TTS
    // --------------------------------

    console.log("Generating speech with Edge TTS...");

    execFile(
      "python",
      [
        "-m",
        "edge_tts",
        "--voice",
        selectedVoice,
        "--text",
        translatedText,
        "--write-media",
        outputPath,
      ],
      (error, stdout, stderr) => {
        if (error) {
          console.error("Edge TTS Error:");
          console.error(stderr || error.message);

          return res.status(500).json({
            success: false,
            message: "Unable to generate speech with Edge TTS.",
          });
        }

        // --------------------------------
        // CHECK AUDIO FILE
        // --------------------------------

        if (!fs.existsSync(outputPath)) {
          return res.status(500).json({
            success: false,
            message: "Audio file was not generated.",
          });
        }

        const audioUrl =
          `http://localhost:${PORT}/audio/${filename}`;

        console.log("Audio generated successfully.");
        console.log("Voice:", selectedVoice);
        console.log("File:", filename);

        // --------------------------------
        // RESPONSE
        // --------------------------------

        res.json({
          success: true,
          message: "Speech generated successfully.",
          audioUrl,
          voice,
          language,
          originalText: text,
          translatedText,
        });
      }
    );
  } catch (error) {
    console.error("Server Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to generate speech.",
    });
  }
});

// ------------------------------------
// START SERVER
// ------------------------------------

app.listen(PORT, () => {
  console.log("");
  console.log("======================================");
  console.log("       VOXIFY TEXT TO SPEECH");
  console.log("======================================");
  console.log(`Server: http://localhost:${PORT}`);
  console.log("Engine: Microsoft Edge Neural TTS");
  console.log("Translation: Google Translate");
  console.log("======================================");
  console.log("");
});