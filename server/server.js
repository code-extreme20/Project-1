const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Audio folder
const audioFolder = path.join(__dirname, "audio");

if (!fs.existsSync(audioFolder)) {
  fs.mkdirSync(audioFolder);
}

// Make audio files accessible
app.use("/audio", express.static(audioFolder));


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
// TEXT TO SPEECH
// ------------------------------------
app.post("/api/tts", async (req, res) => {

  try {

    const { text, language, voice } = req.body;

    // Validate text
    if (!text || !text.trim()) {

      return res.status(400).json({
        success: false,
        message: "Text is required.",
      });

    }

    // Validate length
    if (text.length > 5000) {

      return res.status(400).json({
        success: false,
        message: "Text cannot exceed 5000 characters.",
      });

    }

    // Supported languages
    const supportedLanguages = [
      "en-US",
      "hi-IN",
      "gu-IN",
      "mr-IN",
      "es-ES",
      "fr-FR",
      "de-DE",
    ];

    if (!supportedLanguages.includes(language)) {

      return res.status(400).json({
        success: false,
        message: "Unsupported language.",
      });

    }

    // Validate voice
    if (!["male", "female"].includes(voice)) {

      return res.status(400).json({
        success: false,
        message: "Invalid voice.",
      });

    }

    console.log("");
    console.log("--------------------------------");
    console.log("TTS REQUEST");
    console.log("--------------------------------");
    console.log("Language:", language);
    console.log("Gender:", voice);
    console.log("Characters:", text.length);
    console.log("--------------------------------");


    // Unique filename
    const filename =
      `speech-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.wav`;

    const outputPath = path.join(audioFolder, filename);


    // PowerShell script
    const psScript = `
Add-Type -AssemblyName System.Speech

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

$culture = New-Object System.Globalization.CultureInfo("${language}")

if ("${voice}" -eq "male") {
    $synth.SelectVoiceByHints(
        [System.Speech.Synthesis.VoiceGender]::Male,
        [System.Speech.Synthesis.VoiceAge]::Adult,
        0,
        $culture
    )
}
else {
    $synth.SelectVoiceByHints(
        [System.Speech.Synthesis.VoiceGender]::Female,
        [System.Speech.Synthesis.VoiceAge]::Adult,
        0,
        $culture
    )
}

$synth.SetOutputToWaveFile("${outputPath.replace(/\\/g, "\\\\")}")
$synth.Speak("${text.replace(/"/g, '""')}")
$synth.Dispose()
`;


    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        psScript,
      ],
      (error, stdout, stderr) => {

        if (error) {

          console.error("PowerShell TTS Error:");
          console.error(stderr || error.message);

          return res.status(500).json({
            success: false,
            message:
              "Windows could not generate speech with the selected voice.",
          });

        }


        // Check generated file
        if (!fs.existsSync(outputPath)) {

          return res.status(500).json({
            success: false,
            message: "Audio file was not generated.",
          });

        }


        const audioUrl =
          `http://localhost:${PORT}/audio/${filename}`;


        console.log("Audio generated successfully.");
        console.log("Voice:", voice);
        console.log("File:", filename);


        res.json({
          success: true,
          message: "Speech generated successfully.",
          audioUrl,
          voice,
          language,
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
  console.log("======================================");
  console.log("");

});