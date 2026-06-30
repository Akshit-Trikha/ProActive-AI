import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser middleware
app.use(express.json());

// Initialize Gemini Client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API endpoint to analyze tasks and return optimized action plan
app.post("/api/analyze-tasks", async (req, res) => {
  try {
    const { tasks, currentTime } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "Tasks array is required and must not be empty." });
    }

    const tasksString = JSON.stringify(tasks, null, 2);

    const prompt = `
You are the "Last-Minute Life Saver" AI, a highly pragmatic, action-focused productivity coach.
Your job is to take a list of tasks/deadlines and analyze them to prevent missed deadlines.
Focus on overcoming procrastination by breaking tasks into ridiculous, low-barrier-to-entry micro-steps (e.g. "Open the document and type 1 sentence", not "Write essay").

The user's current local time is: ${currentTime || new Date().toISOString()}

Here are the tasks:
${tasksString}

Analyze these tasks. Determine:
1. Exact priority level (CRITICAL, HIGH, MEDIUM, LOW) based on hours remaining to deadline.
2. An urgency score (1-100).
3. Hours remaining from current local time to the task's deadline.
4. Exactly 3 to 5 micro-steps that are extremely low-friction to start immediately.
5. Realistic focus schedule recommendation with time slots.
6. Custom, realistic productivity advice to beat procrastination (not generic platitudes).
7. A short, direct, highly motivating speech/message (max 3 sentences) to kick them into gear.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["analyzedTasks", "schedule", "productivityRecommendations", "motivationalSpeech"],
          properties: {
            analyzedTasks: {
              type: Type.ARRAY,
              description: "List of analyzed tasks matching original IDs.",
              items: {
                type: Type.OBJECT,
                required: ["id", "calculatedPriority", "urgencyScore", "hoursRemaining", "substeps", "timeEstimate"],
                properties: {
                  id: { type: Type.STRING, description: "The original task ID." },
                  calculatedPriority: { 
                    type: Type.STRING, 
                    description: "CRITICAL (due very soon), HIGH (due in 24h), MEDIUM (due in 2-3 days), LOW (due later)." 
                  },
                  urgencyScore: { type: Type.INTEGER, description: "A score from 1 (lowest) to 100 (due right now)." },
                  hoursRemaining: { type: Type.NUMBER, description: "Calculated hours remaining until deadline." },
                  substeps: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING }, 
                    description: "Ultra-low-friction starter steps to beat procrastination." 
                  },
                  timeEstimate: { type: Type.STRING, description: "Approximate focus time needed, e.g., '30 mins'." }
                }
              }
            },
            schedule: {
              type: Type.ARRAY,
              description: "A focused schedule starting from now to tackle the tasks.",
              items: {
                type: Type.OBJECT,
                required: ["timeSlot", "taskTitle", "focusInstruction"],
                properties: {
                  timeSlot: { type: Type.STRING, description: "Recommended clock-time block, e.g., '10:00 AM - 10:45 AM'." },
                  taskTitle: { type: Type.STRING, description: "Title of the task to focus on during this block." },
                  focusInstruction: { type: Type.STRING, description: "Specific, high-focus single rule for this block." }
                }
              }
            },
            productivityRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Proactive tips to eliminate distractions, manage fatigue, and stay focused."
            },
            motivationalSpeech: { 
              type: Type.STRING, 
              description: "A direct, realistic, no-nonsense motivational wake-up call (2-3 sentences)." 
            }
          }
        }
      }
    });

    const textResult = response.text || "{}";
    const parsedData = JSON.parse(textResult.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error analyzing tasks:", error);
    res.status(500).json({ error: error.message || "Failed to analyze tasks." });
  }
});

// API endpoint to assist in a specific task action (e.g. extension request, drafting intro)
app.post("/api/help-action", async (req, res) => {
  try {
    const { taskTitle, deadline, actionType, notes } = req.body;

    if (!taskTitle) {
      return res.status(400).json({ error: "Task title is required." });
    }

    let instruction = "";
    if (actionType === "extension_request") {
      instruction = `Write a highly polite, professional, and convincing request for a deadline extension. Keep it brief, realistic, and do not make up overly dramatic excuses. Include placeholders for names.`;
    } else if (actionType === "task_breakdown") {
      instruction = `Break down this task into detailed sub-tasks, estimating the minutes needed for each. Focus on extremely clear, sequential steps.`;
    } else if (actionType === "draft_starter") {
      instruction = `Write a high-quality introductory draft or starter outline to help me overcome writer's block and get rolling on this task immediately. Make it practical and ready to edit.`;
    } else {
      instruction = `Give me direct, tactical, high-focus advice on how to finish this task under extreme pressure. Be brief and practical.`;
    }

    const prompt = `
Task: "${taskTitle}"
Deadline: "${deadline || 'Not specified'}"
Additional Notes: "${notes || 'None'}"

Goal: ${instruction}
Format: Return clear, markdown-formatted text that can be copied directly. Do not include excessive introduction, just give the useful content.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ output: response.text || "No response generated." });
  } catch (error: any) {
    console.error("Error in task helper action:", error);
    res.status(500).json({ error: error.message || "Failed to generate action help." });
  }
});

// Helper to prepend a 44-byte WAV header to raw PCM data
function addWavHeader(pcmBuffer: Buffer, sampleRate: number = 24000, numChannels: number = 1, bitsPerSample: number = 16): Buffer {
  const header = Buffer.alloc(44);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  // "RIFF" chunk descriptor
  header.write("RIFF", 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write("WAVE", 8);

  // "fmt " sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22); // NumChannels
  header.writeUInt32LE(sampleRate, 24);  // SampleRate
  header.writeUInt32LE(byteRate, 28);    // ByteRate
  header.writeUInt16LE(blockAlign, 32);  // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34); // BitsPerSample

  // "data" sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// API endpoint to generate high-energy TTS briefing
app.post("/api/generate-briefing-tts", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required to generate audio." });
    }

    // Limit text length to prevent too long TTS calls
    const trimmedText = text.substring(0, 400);

    const prompt = `Read the following motivational productivity briefing in a high-energy, direct, supportive, and realistic tone to motivate someone working against a strict deadline. Stay concise and encouraging. Here is the text: "${trimmedText}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Zephyr" },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const base64Audio = inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: "Failed to generate text-to-speech audio." });
    }

    res.json({ 
      audio: base64Audio, 
      mimeType: inlineData?.mimeType || "audio/L16;rate=24000" 
    });
  } catch (error: any) {
    console.error("Error generating TTS:", error);
    res.status(500).json({ error: error.message || "Failed to generate text-to-speech briefing." });
  }
});

// API endpoint to parse unstructured text into structured tasks
app.post("/api/parse-chaos", async (req, res) => {
  try {
    const { text, currentTime } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text content is required." });
    }

    const referenceTime = currentTime || new Date().toISOString();

    const prompt = `
You are an expert scheduler. You will parse messy, unstructured, and panicked statements of commitments, errands, chores, or deadlines and map them into a structured JSON list of task items.
Reference Time: ${referenceTime} (use this to accurately calculate relative deadlines like "tomorrow afternoon", "Wednesday 10am", "due in 2 hours", "next monday").

Guidelines for relative deadlines:
- Current Time of user is: ${referenceTime}.
- If user says "today", use the date of the Reference Time.
- If user says "due in 2 hours", calculate the exact date and time exactly 2 hours after the Reference Time.
- If user says "tomorrow morning", use the date of tomorrow at 9:00 AM.
- If user says "Friday 5pm", use the date of the nearest upcoming Friday at 17:00.
- Convert all deadlines to ISO-8601 datetime format (e.g. "2026-06-30T17:00:00").

Categorize each task into one of these:
- 'assignment' (school homework, reports, papers, slides, projects)
- 'exam' (tests, midterms, quizzes, finals, certifications)
- 'meeting' (interviews, syncs, presentations, group work, pitches)
- 'bill' (rent, utility, credit card payments, renewals)
- 'other' (general chores, gym, groceries, miscellaneous)

Text to parse:
"${text}"
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["parsedTasks"],
          properties: {
            parsedTasks: {
              type: Type.ARRAY,
              description: "List of parsed tasks.",
              items: {
                type: Type.OBJECT,
                required: ["title", "deadline", "category", "notes"],
                properties: {
                  title: { type: Type.STRING, description: "Name of the task/commitment." },
                  deadline: { type: Type.STRING, description: "Calculated absolute deadline in ISO 8601 format." },
                  category: { 
                    type: Type.STRING, 
                    description: "assignment, exam, meeting, bill, or other" 
                  },
                  notes: { type: Type.STRING, description: "Any other details like cost, subject name, or requirements extracted." }
                }
              }
            }
          }
        }
      }
    });

    const textResult = response.text || "{}";
    const parsedData = JSON.parse(textResult.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error parsing chaos dump:", error);
    res.status(500).json({ error: error.message || "Failed to parse unstructured commitments." });
  }
});

// API endpoint for interactive focus coaching chat
app.post("/api/chat-coach", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    const systemInstruction = `
You are the "AI Emergency Focus Coach", a highly supportive, action-oriented, and direct productivity advisor on-call for panicking students, professionals, and entrepreneurs.
Your style is direct, clear, and focused on helping the user beat procrastination by taking immediate micro-actions.

Rules:
1. Avoid long introductory fluff. Jump straight to the point.
2. Break complex tasks down into simple "5-minute starting points".
3. Proactively offer to write/draft outlines, draft polite email extension requests, or design 15-minute rescue blocks depending on the user's situation.
4. Be highly empathetic but do not indulge excuses. Keep pushing them to take small physical actions (e.g., "put your phone on the shelf across the room right now").
5. Keep your final output under 4 short paragraphs.
`;

    let prompt = `${systemInstruction}\n\n`;
    if (history && Array.isArray(history) && history.length > 0) {
      prompt += "Conversation History:\n";
      history.forEach((m: any) => {
        const roleName = m.sender === 'user' ? 'User' : 'Coach';
        prompt += `${roleName}: ${m.text}\n`;
      });
      prompt += "\n";
    }
    prompt += `User: ${message}\nCoach:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ reply: response.text || "I'm right here with you. Let's break this down together." });
  } catch (error: any) {
    console.error("Error in chat coach:", error);
    res.status(500).json({ error: error.message || "Failed to chat with coach." });
  }
});

// Setup Vite Dev Server / Static Hosting
async function startServer() {
  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Last-Minute Life Saver] Server is running on port ${PORT}`);
  });

  if (vite) {
    server.on("upgrade", (req, socket, head) => {
      vite.ws.handleUpgrade(req, socket, head);
    });
  }
}

startServer();
