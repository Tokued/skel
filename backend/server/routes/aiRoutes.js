const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");

const router = express.Router();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Claude model used for recommendations. Override with CLAUDE_MODEL in .env
// (e.g. "claude-haiku-4-5" for a cheaper/faster run on this simple task).
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-opus-5";

const anthropic = CLAUDE_API_KEY
  ? new Anthropic({ apiKey: CLAUDE_API_KEY })
  : null;

router.post("/recommend", async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: "Description is required" });
  }

  if (!anthropic) {
    return res.status(500).json({ error: "Missing Claude API key" });
  }

  try {
    const prompt = `
You are a movie recommendation engine.

User description:
"${description}"

Return ONLY a valid JSON array of 30 distinct real movie titles that fit the description.

Rules:
- No explanations
- No markdown
- No code blocks
- No extra text
- No Duplicates

Example:
["Inception", "The Matrix", "Interstellar", "Fight Club", "The Dark Knight", "Pulp Fiction", "The Lord of the Rings: The Fellowship of the Ring", "The Shawshank Redemption", "The Godfather", "Forrest Gump"]
`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    let text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
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
    movies = movies.slice(0, 30);

    return res.json({ movies });
  } catch (err) {
    const details =
      err instanceof Anthropic.APIError
        ? { status: err.status, message: err.message }
        : err.message;
    console.error("Claude AI error:", details);
    return res.status(500).json({
      error: "AI request failed",
      details,
    });
  }
});

module.exports = router;
