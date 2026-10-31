import express from "express";
import cors from "cors";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";

const app = express();

app.set("trust proxy", 1);

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(",").map(s => s.trim())
    : true
}));

app.use(express.json({ limit: "20kb" }));

app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MODEL = process.env.AI_MODEL || "gpt-6-astra";

app.get("/", (req, res) => {
  res.json({
    app: "Dave AI",
    status: "online"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        error: "Your message is too long."
      });
    }

    if (!Array.isArray(history) || history.length > 10) {
      return res.status(400).json({
        error: "Invalid conversation history."
      });
    }

    const safeHistory = history
      .filter(item =>
        item &&
        ["user", "assistant"].includes(item.role) &&
        typeof item.content === "string"
      )
      .slice(-10)
      .map(item => ({
        role: item.role,
        content: item.content.slice(0, 4000)
      }));

    const response = await ai.responses.create({
      model: MODEL,
      instructions: `
You are Dave AI, a helpful, friendly and intelligent AI assistant.
Give clear, accurate answers.
Explain difficult topics step by step.
Admit when you are uncertain.
Do not claim to have performed actions you did not perform.
      `,
      input: [
        ...safeHistory,
        {
          role: "user",
          content: message.trim()
        }
      ],
      max_output_tokens: 1200
    });

    res.json({
      reply: response.output_text
    });

  } catch (error) {
    console.error("Dave AI request failed:", error.status || "unknown");

    res.status(500).json({
      error: "Dave AI could not answer. Please try again."
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Dave AI backend running on port ${PORT}`);
});