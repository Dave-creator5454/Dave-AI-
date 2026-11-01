
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
  res.json({ message: "Dave AI backend is running!" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions:
        "You are Dave AI, a helpful, intelligent assistant. Answer clearly and accurately. Support English and Afaan Oromoo.",
      input: message
    });

    res.json({
      reply: response.output_text
    });

  } catch (error) {
    console.error("Dave AI error:", error.message);

    res.status(500).json({
      error: "Dave AI could not answer. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Dave AI running on port ${PORT}`);
});
