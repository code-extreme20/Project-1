# Voxify - Text-to-Speech Application

Voxify is a full-stack Text-to-Speech web application that converts written text into spoken audio.

Users can enter or paste text, select a language and voice, generate speech, listen to the generated audio, and download the generated audio file.

---

## Features

- Text-to-Speech conversion
- Language selection
- Female and Male voice selection
- Maximum text limit of 5000 characters
- Character counter
- Word counter
- Audio playback
- Audio download
- Clear text option
- Input validation
- Error handling
- REST API using Node.js and Express
- Responsive React interface

---

## Technologies Used

### Frontend

- React
- Vite
- JavaScript
- HTML5
- CSS3
- Axios

### Backend

- Node.js
- Express.js
- CORS
- Windows Speech Synthesis API

---

## Project Structure

```text
text-to-speech/
│
├── server/
│   ├── audio/
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── src/
│   ├── assets/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── public/
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── README.md
└── vite.config.js
```

---

## How the Application Works

The application follows this flow:

```text
User
  |
  v
React Frontend
  |
  | HTTP Request
  v
Node.js + Express Backend
  |
  | Text + Language + Voice
  v
Windows Speech Synthesis
  |
  | Generated WAV Audio
  v
Express Backend
  |
  | Audio URL
  v
React Frontend
  |
  +----> Audio Player
  |
  +----> Download Audio
```

### Process

1. The user enters text into the application.
2. The user selects a language.
3. The user selects a voice.
4. React sends the text, language and voice to the backend.
5. The Express backend validates the request.
6. Windows Speech Synthesis generates the speech audio.
7. The generated WAV file is stored temporarily in the server audio folder.
8. The backend returns the audio URL.
9. React loads the generated audio.
10. The user can play or download the audio.

---

## Frontend

The frontend is developed using React and Vite.

The main application contains:

- Text input area
- Character counter
- Word counter
- Language selector
- Voice selector
- Generate Speech button
- Clear button
- Audio player
- Download button
- Error messages

---

## Backend

The backend is developed using Node.js and Express.js.

The backend is responsible for:

- Receiving requests from the React frontend
- Validating user input
- Validating supported languages
- Validating supported voices
- Generating speech
- Creating WAV audio files
- Returning audio URLs
- Handling errors
- Serving generated audio files

---

## API Endpoints

### 1. Health Check

```http
GET /api/health
```

Full URL:

```text
http://localhost:5000/api/health
```

Example response:

```json
{
  "success": true,
  "message": "TTS server is running"
}
```

---

### 2. Get Available Voices

```http
GET /api/voices
```

Full URL:

```text
http://localhost:5000/api/voices
```

This endpoint returns the voice options available to the application.

---

### 3. Generate Speech

```http
POST /api/tts
```

Full URL:

```text
http://localhost:5000/api/tts
```

Example request:

```json
{
  "text": "Hello, this is my text to speech application.",
  "language": "en-US",
  "voice": "female"
}
```

Example voice values:

```text
female
male
```

A successful request returns an audio URL that can be used by the frontend audio player.

---

## Validation

The backend validates:

- Empty text
- Maximum text length
- Supported language
- Supported voice
- Invalid requests
- Missing request data

Invalid language or voice requests return a `400 Bad Request` response.

---

## Text Limit

The application currently supports a maximum of:

```text
5000 characters
```

The frontend displays the character count and prevents excessively large text input.

---

## Audio

The current application generates audio in:

```text
WAV
```

Generated audio files are temporarily stored inside:

```text
server/audio/
```

The frontend provides an audio player and download option.

---

## Current TTS Implementation

The current backend uses the:

```text
Windows Speech Synthesis API
```

The available speech voices depend on the speech voices installed on the Windows computer running the backend.

For example, the system may have voices such as:

```text
Microsoft David Desktop
Microsoft Zira Desktop
```

Language availability therefore depends on the installed Windows speech voices.

---

## Running the Project

### Step 1 - Install Frontend Dependencies

Open a terminal in the main project folder:

```bash
npm install
```

---

### Step 2 - Install Backend Dependencies

Open a terminal and move into the server folder:

```bash
cd server
npm install
```

---

### Step 3 - Start the Backend

Inside the `server` folder:

```bash
node server.js
```

The backend runs on:

```text
http://localhost:5000
```

---

### Step 4 - Start the Frontend

Open another terminal in the main project folder:

```bash
npm run dev
```

Vite will provide a local development URL, normally similar to:

```text
http://localhost:5173
```

Open that URL in your browser.

---

## API Testing with Postman

The following APIs can be tested using Postman:

```text
GET  /api/health
GET  /api/voices
POST /api/tts
```

### Example POST Request

Method:

```text
POST
```

URL:

```text
http://localhost:5000/api/tts
```

Body:

```json
{
  "text": "This is a test of the text to speech application.",
  "language": "en-US",
  "voice": "female"
}
```

---

## Error Testing

The application was tested for:

- Empty text
- Invalid language
- Invalid voice
- Maximum text length
- Successful speech generation
- Audio playback
- Audio download

Example invalid language:

```json
{
  "text": "This is a validation test.",
  "language": "xx-XX",
  "voice": "female"
}
```

The backend returns:

```text
400 Bad Request
```

for an unsupported language.

---

## Security and Project Configuration

The project uses a `.gitignore` file to prevent unnecessary or sensitive files from being committed.

Ignored files include:

```text
node_modules/
.env
server/audio/
dist/
*.log
```

The generated audio folder is excluded from Git because audio files are generated during application usage.

---

## Responsive Design

The frontend is designed to work across different screen sizes, including:

- Desktop
- Laptop
- Tablet
- Mobile

---

## Future Improvements

The application can be extended with:

- More TTS voices
- More language support
- Cloud-based Text-to-Speech services
- Speech speed control
- Pitch control
- Volume control
- Speech history
- User authentication
- Favorites
- TXT file upload
- PDF file upload
- DOCX file upload
- Cloud deployment
- Database integration

---

## Learning Outcomes

This project demonstrates:

- React frontend development
- Node.js backend development
- Express.js REST APIs
- Frontend and backend communication
- HTTP requests
- JSON data handling
- Form validation
- Error handling
- Text-to-Speech integration
- Audio file handling
- Postman API testing
- Basic project security
- Responsive web design

---

## Author

**Harsh Sharma**

---

## Project Type

**Full-Stack Web Development Project**

### Stack

```text
Frontend  : React + Vite
Backend   : Node.js + Express.js
TTS       : Windows Speech Synthesis API
Audio     : WAV
API Test  : Postman
```

---

## Project Status

```text
Frontend                 ✅
Backend                  ✅
REST API                 ✅
Text Validation          ✅
Language Validation     ✅
Voice Validation         ✅
Male/Female Voice       ✅
Audio Generation        ✅
Audio Playback          ✅
Audio Download          ✅
Postman Testing          ✅
Responsive UI            ✅
README Documentation    ✅
```