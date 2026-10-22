# SmartNote

SmartNote turns lecture notes into a plain-language explanation, key points, and practice questions.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`:

   ```text
   Copy-Item .env.example .env
   ```

3. Add your OpenAI API key to `.env`:

   ```text
   OPENAI_API_KEY=your_key_here
   ```

4. Start the app:

   ```powershell
   npm start
   ```

5. Open <http://localhost:3000>.

The app uses OpenAI's `gpt-4.1-mini` through a server-side endpoint. The API key stays in `.env` and is never sent to the browser. Do not commit `.env`. OpenAI API usage may incur charges on your account.

## Notes and privacy

SmartNote accepts pasted text and PDF, JPG, PNG, or WEBP files up to 15 MB. When you request a study guide, the supplied notes are sent to OpenAI for processing. SmartNote does not save uploaded notes or generated guides.
