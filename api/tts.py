import json
import base64
import tempfile
import os
import asyncio

from http.server import BaseHTTPRequestHandler
import edge_tts


LANGUAGE_CONFIG = {
    "en-US": {
        "male": "en-US-GuyNeural",
        "female": "en-US-JennyNeural",
        "target": "en",
    },
    "hi-IN": {
        "male": "hi-IN-MadhurNeural",
        "female": "hi-IN-SwaraNeural",
        "target": "hi",
    },
    "gu-IN": {
        "male": "gu-IN-NiranjanNeural",
        "female": "gu-IN-DhwaniNeural",
        "target": "gu",
    },
    "mr-IN": {
        "male": "mr-IN-ManoharNeural",
        "female": "mr-IN-AarohiNeural",
        "target": "mr",
    },
    "es-ES": {
        "male": "es-ES-AlvaroNeural",
        "female": "es-ES-ElviraNeural",
        "target": "es",
    },
    "fr-FR": {
        "male": "fr-FR-HenriNeural",
        "female": "fr-FR-DeniseNeural",
        "target": "fr",
    },
    "de-DE": {
        "male": "de-DE-ConradNeural",
        "female": "de-DE-KatjaNeural",
        "target": "de",
    },
}


async def generate_audio(text, voice):
    temp_file = tempfile.NamedTemporaryFile(
        suffix=".mp3",
        delete=False
    )

    temp_file.close()

    communicate = edge_tts.Communicate(text, voice)

    await communicate.save(temp_file.name)

    with open(temp_file.name, "rb") as audio:
        audio_data = audio.read()

    os.remove(temp_file.name)

    return audio_data


class handler(BaseHTTPRequestHandler):

    def _send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()

        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()

    def do_POST(self):

        try:

            content_length = int(
                self.headers.get("Content-Length", 0)
            )

            body = self.rfile.read(content_length)

            data = json.loads(body.decode("utf-8"))

            text = data.get("text", "").strip()
            language = data.get("language")
            voice = data.get("voice")

            # -----------------------------
            # VALIDATE TEXT
            # -----------------------------

            if not text:
                return self._send_json(
                    400,
                    {
                        "success": False,
                        "message": "Text is required."
                    }
                )

            if len(text) > 5000:
                return self._send_json(
                    400,
                    {
                        "success": False,
                        "message": "Text cannot exceed 5000 characters."
                    }
                )

            # -----------------------------
            # VALIDATE LANGUAGE
            # -----------------------------

            if language not in LANGUAGE_CONFIG:
                return self._send_json(
                    400,
                    {
                        "success": False,
                        "message": "Unsupported language."
                    }
                )

            # -----------------------------
            # VALIDATE VOICE
            # -----------------------------

            if voice not in ["male", "female"]:
                return self._send_json(
                    400,
                    {
                        "success": False,
                        "message": "Invalid voice."
                    }
                )

            config = LANGUAGE_CONFIG[language]

            selected_voice = config[voice]

            # -----------------------------
            # TRANSLATION
            # -----------------------------

            translated_text = text

            if config["target"] != "en":

                import urllib.parse
                import urllib.request

                encoded_text = urllib.parse.quote(text)

                url = (
                    "https://translate.googleapis.com/translate_a/single"
                    "?client=gtx"
                    "&sl=auto"
                    f"&tl={config['target']}"
                    "&dt=t"
                    f"&q={encoded_text}"
                )

                with urllib.request.urlopen(
                    url,
                    timeout=15
                ) as response:

                    result = json.loads(
                        response.read().decode("utf-8")
                    )

                translated_text = "".join(
                    item[0]
                    for item in result[0]
                    if item and item[0]
                )

            # -----------------------------
            # GENERATE AUDIO
            # -----------------------------

            audio_data = asyncio.run(
                generate_audio(
                    translated_text,
                    selected_voice
                )
            )

            audio_base64 = base64.b64encode(
                audio_data
            ).decode("utf-8")

            # -----------------------------
            # RESPONSE
            # -----------------------------

            return self._send_json(
                200,
                {
                    "success": True,
                    "message": "Speech generated successfully.",
                    "audioBase64": audio_base64,
                    "voice": voice,
                    "language": language,
                    "originalText": text,
                    "translatedText": translated_text
                }
            )

        except Exception as error:

            print("TTS ERROR:", error)

            return self._send_json(
                500,
                {
                    "success": False,
                    "message": "Unable to generate speech.",
                    "error": str(error)
                }
            )