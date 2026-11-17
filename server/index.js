const { createApp } = require('./app');

const PORT = process.env.PORT || 8000;
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.error('Set OPENAI_API_KEY before starting the server.');
    process.exit(1);
}

createApp({ apiKey, model: process.env.OPENAI_MODEL }).listen(PORT, () =>
    console.log(`API server running on port ${PORT}`)
);
