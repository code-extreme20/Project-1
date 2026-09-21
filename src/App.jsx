import { useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en-US");
  const [voice, setVoice] = useState("female");
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");

  const maxCharacters = 5000;

  const wordCount = text.trim()
    ? text.trim().split(/\s+/).length
    : 0;

  const handleGenerate = async () => {
    setError("");
    setAudioUrl("");

    if (!text.trim()) {
      setError("Please enter some text first.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          language,
          voice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate speech.");
      }

      setAudioUrl(data.audioUrl);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setAudioUrl("");
    setError("");
  };

  return (
    <div className="app">

      <div className="background-glow glow-one"></div>
      <div className="background-glow glow-two"></div>

      <div className="container">

        {/* NAVBAR */}
        <nav className="navbar">
          <div className="brand">
            <div className="brand-icon">✦</div>

            <div>
              <div className="brand-name">Voxify</div>
              <div className="brand-subtitle">TEXT TO SPEECH</div>
            </div>
          </div>

          <div className="status">
            <span className="status-dot"></span>
            AI Voice Studio
          </div>
        </nav>

        {/* HERO */}
        <section className="hero">

          <div className="hero-badge">
            <span>✦</span>
            AI POWERED VOICE GENERATOR
          </div>

          <h1>
            Turn your words into
            <span> natural speech.</span>
          </h1>

          <p>
            Transform written text into clear, natural-sounding speech
            with a simple and powerful voice studio.
          </p>

        </section>

        {/* MAIN CARD */}
        <main className="studio-card">

          <div className="card-top">

            <div>
              <p className="eyebrow">VOICE STUDIO</p>
              <h2>Create your audio</h2>
            </div>

            <div className="character-count">
              <strong>{text.length}</strong>
              <span> / {maxCharacters}</span>
            </div>

          </div>

          {/* TEXT AREA */}
          <div className="input-wrapper">

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={maxCharacters}
              placeholder="Start typing or paste your text here..."
            />

            <div className="textarea-bottom">

              <div className="input-tip">
                <span>⌘</span>
                Your text will be converted into speech
              </div>

              <div className="word-count">
                {wordCount} words
              </div>

            </div>

          </div>

          {/* CONTROLS */}
          <div className="controls">

            <div className="control">

              <label>
                <span className="control-icon">文</span>
                Language
              </label>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en-US">English — US</option>
                <option value="hi-IN">Hindi — India</option>
                <option value="gu-IN">Gujarati — India</option>
                <option value="mr-IN">Marathi — India</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
              </select>

            </div>

            <div className="control">

              <label>
                <span className="control-icon">◉</span>
                Voice
              </label>

              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
              >
                <option value="female">Female — Natural</option>
                <option value="male">Male — Natural</option>
              </select>

            </div>

          </div>

          {/* ERROR */}
          {error && (
            <div className="error-box">
              <span>!</span>
              {error}
            </div>
          )}

          {/* ACTIONS */}
          <div className="actions">

            <button
              className="generate-button"
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Generating...
                </>
              ) : (
                <>
                  Generate Speech
                  <span className="arrow">→</span>
                </>
              )}
            </button>

            <button
              className="clear-button"
              onClick={handleClear}
            >
              Clear
            </button>

          </div>

          {/* AUDIO */}
          {audioUrl && (
            <div className="audio-result">

              <div className="audio-heading">

                <div className="audio-icon">
                  ♪
                </div>

                <div>
                  <p>YOUR AUDIO</p>
                  <h3>Speech generated successfully</h3>
                </div>

              </div>

              <audio controls src={audioUrl}></audio>

              <a
              href={audioUrl}
              download="generated-speech.wav"
              className="download-button"
              >
                ↓ Download Audio
              </a>

            </div>
          )}

        </main>

        {/* FEATURES */}
        <div className="features">

          <div className="feature">
            <span>◉</span>
            Multiple Languages
          </div>

          <div className="feature">
            <span>◈</span>
            Natural Voices
          </div>

          <div className="feature">
            <span>↯</span>
            Fast Generation
          </div>

          <div className="feature">
            <span>↓</span>
            Audio Download
          </div>

        </div>

        <footer>
          Built with React + Node.js + Express
        </footer>

      </div>
    </div>
  );
}

export default App;