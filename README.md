# SmartNote

SmartNote answers questions on any topic and turns lecture notes into plain-language explanations, key points, and practice questions.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`:

   ```text
   Copy-Item .env.example .env
   ```

3. Add your OpenRouter API key to `.env`:

   ```text
   OPENROUTER_API_KEY=your_key_here
   ```

4. Start the app:

   ```powershell
   npm start
   ```

5. Open <http://localhost:3000>.

The app uses OpenRouter's free-model router through a server-side endpoint. Free-model availability and usage limits may vary, and no AI can guarantee a correct answer to every question. The API key stays in `.env` and is never sent to the browser. Do not commit `.env`.

## Notes and privacy

SmartNote accepts questions, pasted text, and PDF, JPG, PNG, or WEBP files up to 15 MB. When you ask a question or request a study guide, the supplied notes and files are sent to OpenRouter for processing. SmartNote does not save uploaded notes or generated guides.
