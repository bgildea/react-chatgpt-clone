const PORT = 8000;
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
    console.error('Set OPENAI_API_KEY before starting the server.');
    process.exit(1);
}

app.post('/completions', async (req, res) => {
    const options = {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: req.body.message }],
            max_tokens: 200,
        })
    };
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', options);
        const data = await response.json();
        res.send(data);
    } catch (error) {
        console.error(error);
        res.status(502).send({ error: 'Could not reach the OpenAI API' });
    }
});

app.listen(PORT, () => console.log('Your server is running on PORT ' + PORT));
