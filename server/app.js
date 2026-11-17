const express = require('express');
const cors = require('cors');

const MAX_MESSAGES = 20;
const MAX_CHARS = 4000;
const ROLES = new Set(['user', 'assistant']);

// Turn the client's chat history into the messages array the API expects.
// Returns { messages } or { error } so the route can answer 400 without calling the API.
function buildMessages(history) {
    if (!Array.isArray(history) || history.length === 0) {
        return { error: 'Send a non-empty "messages" array.' };
    }
    const recent = history.slice(-MAX_MESSAGES);
    const messages = [];
    for (const item of recent) {
        if (!item || !ROLES.has(item.role) || typeof item.content !== 'string') {
            return { error: 'Each message needs a role of "user" or "assistant" and text content.' };
        }
        const content = item.content.trim();
        if (!content) return { error: 'Messages cannot be empty.' };
        if (content.length > MAX_CHARS) return { error: `Messages are limited to ${MAX_CHARS} characters.` };
        messages.push({ role: item.role, content });
    }
    if (messages[messages.length - 1].role !== 'user') {
        return { error: 'The last message must come from the user.' };
    }
    return { messages };
}

function createApp({ apiKey, model = 'gpt-4o-mini', fetchImpl = fetch } = {}) {
    const app = express();
    app.use(express.json({ limit: '100kb' }));
    app.use(cors());

    app.post('/completions', async (req, res) => {
        const { messages, error } = buildMessages(req.body && req.body.messages);
        if (error) return res.status(400).send({ error });

        try {
            const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ model, messages, max_tokens: 500 }),
            });
            const data = await response.json();
            if (!response.ok) {
                // Pass on the status but never the raw upstream body, which can echo request details.
                return res.status(response.status).send({ error: 'The model API returned an error.' });
            }
            const reply = data.choices && data.choices[0] && data.choices[0].message;
            if (!reply) return res.status(502).send({ error: 'The model API returned no reply.' });
            res.send({ message: { role: 'assistant', content: reply.content } });
        } catch (err) {
            console.error(err.message);
            res.status(502).send({ error: 'Could not reach the model API.' });
        }
    });

    return app;
}

module.exports = { buildMessages, createApp, MAX_MESSAGES, MAX_CHARS };
