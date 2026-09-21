const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const app = express();
const PORT = 5000;

// ======================================
// VOXIFY TEXT TO SPEECH SERVER
// ======================================

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ======================================
// AUDIO FOLDER
// ======================================

const audioDir = path.join(__dirname, "audio");

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

app.use("/audio", express.static(audioDir));

// ======================================
// LANGUAGE CONFIGURATION
// ======================================

const languageConfig = {
  "en-US": {
    name: "English",
    male: "en-US-GuyNeural",
    female: "en-US-JennyNeural",
    target: "en",
  },

  "hi-IN": {
    name: "Hindi",
    male: "hi-IN-MadhurNeural",
    female: "hi-IN-SwaraNeural",
    target: "hi",
  },

  "gu-IN": {
    name: "Gujarati",
    male: "gu-IN-NiranjanNeural",
    female: "gu-IN-DhwaniNeural",
    target: "gu",
  },

  "mr-IN": {
    name: "Marathi",
    male: "mr-IN-ManoharNeural",
    female: "mr-IN-AarohiNeural",
    target: "mr",
  },

  "es-ES": {
    name: "Spanish",
    male: "es-ES-AlvaroNeural",
    female: "es-ES-ElviraNeural",
    target: "es",
  },

  "fr-FR": {
    name: "French",
    male: "fr-FR-HenriNeural",
    female: "fr-FR-DeniseNeural",
    target: "fr",
  },

  "de-DE": {
    name: "German",
    male: "de-DE-ConradNeural",
    female: "de-DE-KatjaNeural",
    target: "de",
  },
};

// ======================================
// TRANSLATION FUNCTION
// ======================================

async function translateText(text, targetLanguage) {
  // English doesn't need translation
  if (targetLanguage === "en") {
    return text;
  }

  try {
    console.log(`Translating text to: ${targetLanguage}`);

    const url =
      "https://translate.googleapis.com/translate_a/single" +
      `?client=gtx` +
      `&sl=auto` +
      `&tl=${targetLanguage}` +
      `&dt=t` +
      `&q=${encodeURIComponent(text)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        `Translation service returned status ${response.status}.`
      );

      console.warn("Using original text instead.");

      return text;
    }

    const data = await response.json();

    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      console.warn("Invalid translation response.");
      console.warn("Using original text instead.");

      return text;
    }

    const translatedText = data[0]
      .map((item) => item?.[0])
      .filter(Boolean)
      .join("");

    if (!translatedText) {
      console.warn("Translation returned empty text.");
      console.warn("Using original text instead.");

      return text;
    }

    console.log("Translation completed successfully.");

    return translatedText;
  } catch (error) {
    console.warn("Translation failed:", error.message);
    console.warn("Using original text instead.");

    return text;
  }
}

// ======================================
// HEALTH API
// ======================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Voxify API is running",
    server: "Node.js + Express",
    ttsEngine: "Microsoft Edge Neural TTS",
    translation: "Google Translate",
  });
});

// ======================================
// VOICES API
// ======================================

app.get("/api/voices", (req, res) => {
  const voices = [];

  Object.entries(languageConfig).forEach(
    ([languageCode, config]) => {
      voices.push({
        language: languageCode,
        languageName: config.name,
        gender: "male",
        voice: config.male,
      });

      voices.push({
        language: languageCode,
        languageName: config.name,
        gender: "female",
        voice: config.female,
      });
    }
  );

  res.json({
    success: true,
    voices,
  });
});

// ======================================
// TEXT TO SPEECH API
// ======================================

app.post("/api/tts", async (req, res) => {
  try {
    const { text, language, voice } = req.body;

    console.log("\n======================================");
    console.log("TTS REQUEST");
    console.log("======================================");

    console.log("Language:", language);
    console.log("Voice:", voice);
    console.log("Characters:", text ? text.length : 0);

    // ==================================
    // VALIDATE TEXT
    // ==================================

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        message: "Text is required.",
      });
    }

    const cleanText = text.trim();

    if (!cleanText) {
      return res.status(400).json({
        success: false,
        message: "Please enter some text.",
      });
    }

    if (cleanText.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Text cannot exceed 5000 characters.",
      });
    }

    // ==================================
    // VALIDATE LANGUAGE
    // ==================================

    if (!languageConfig[language]) {
      return res.status(400).json({
        success: false,
        message: "Unsupported language.",
      });
    }

    // ==================================
    // GET LANGUAGE CONFIG
    // ==================================

    const config = languageConfig[language];

    // ==================================
    // DETERMINE VOICE
    // ==================================

    let selectedVoice;

    if (voice === "male") {
      selectedVoice = config.male;
    } else if (voice === "female") {
      selectedVoice = config.female;
    } else {
      return res.status(400).json({
        success: false,
        message: "Voice must be male or female.",
      });
    }

    console.log("Selected Edge voice:", selectedVoice);

    // ==================================
    // TRANSLATION
    // ==================================

    console.log("Translating text...");

    const translatedText = await translateText(
      cleanText,
      config.target
    );

    console.log("Text for TTS:", translatedText);

    // ==================================
    // CREATE UNIQUE FILE NAME
    // ==================================

    const timestamp = Date.now();

    const randomNumber = Math.floor(
      Math.random() * 100000
    );

    const filename =
      `speech-${timestamp}-${randomNumber}.mp3`;

    const outputPath = path.join(
      audioDir,
      filename
    );

    // ==================================
    // GENERATE SPEECH
    // ==================================

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
          console.error(
            "Edge TTS Error:",
            error
          );

          console.error(
            "STDERR:",
            stderr
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to generate speech.",
            error: error.message,
          });
        }

        // ==================================
        // CHECK AUDIO FILE
        // ==================================

        if (!fs.existsSync(outputPath)) {
          console.error(
            "Audio file was not created."
          );

          return res.status(500).json({
            success: false,
            message:
              "Audio file was not generated.",
          });
        }

        const stats =
          fs.statSync(outputPath);

        console.log(
          "Audio size:",
          stats.size,
          "bytes"
        );

        if (stats.size === 0) {
          console.error(
            "Generated audio file is empty."
          );

          return res.status(500).json({
            success: false,
            message:
              "Generated audio file is empty.",
          });
        }

        // ==================================
        // AUDIO URL
        // ==================================

        const audioUrl =
          `http://localhost:${PORT}/audio/${filename}`;

        console.log(
          "Audio generated successfully."
        );

        console.log(
          "Audio URL:",
          audioUrl
        );

        console.log(
          "======================================\n"
        );

        // ==================================
        // RESPONSE
        // ==================================

        return res.json({
          success: true,
          message:
            "Speech generated successfully.",

          audioUrl,

          filename,

          language,

          languageName:
            config.name,

          voice: selectedVoice,

          gender: voice,

          originalText: cleanText,

          translatedText,
        });
      }
    );
  } catch (error) {
    console.error(
      "Server Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to generate speech.",
      error: error.message,
    });
  }
});

// ======================================
// 404 API
// ======================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

// ======================================
// GLOBAL ERROR HANDLER
// ======================================

app.use((error, req, res, next) => {
  console.error(
    "Global Error:",
    error
  );

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

// ======================================
// START SERVER
// ======================================

app.listen(PORT, () => {
  console.log("\n======================================");
  console.log("       VOXIFY TEXT TO SPEECH");
  console.log("======================================");
  console.log(
    `Server: http://localhost:${PORT}`
  );
  console.log(
    "Engine: Microsoft Edge Neural TTS"
  );
  console.log(
    "Translation: Google Translate"
  );
  console.log("======================================\n");
});