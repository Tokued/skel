const express = require("express");
const axios = require("axios");

const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

router.post("/recommend", async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: "Description is required" });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "Missing Groq API key" });
  }

  try {
    const prompt = `
You are a movie recommendation engine.

User description:
"${description}"

Return ONLY a valid JSON array of 5 real movie titles.

Rules:
- No explanations
- No markdown
- No code blocks
- No extra text

Example:
["Inception", "The Matrix", "Interstellar", "Fight Club", "The Dark Knight"]
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let text = response.data?.choices?.[0]?.message?.content || "[]";

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let movies = [];

    try {
      movies = JSON.parse(text);
    } catch (err) {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          movies = JSON.parse(match[0]);
        } catch (e) {
          movies = [];
        }
      }
    }

    if (!Array.isArray(movies)) movies = [];
    movies = movies.slice(0, 5);

    return res.json({ movies });
  } catch (err) {
    console.error("Groq AI error:", err.response?.data || err.message);
    return res.status(500).json({
      error: "AI request failed",
      details: err.response?.data || err.message,
    });
  }
});

module.exports = router;