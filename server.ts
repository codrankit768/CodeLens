import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

// Initialize Gemini API Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Robust helper function with retry and fallback mechanics to handle 503 errors and high demand peaks
async function generateWithRetryAndFallback(params: {
  contents: any;
  config: any;
}) {
  // A wide range of high-performance & highly-available models to try sequentially.
  // We prioritize highly-stable, high-capacity models like gemini-2.5-flash and gemini-3.1-flash-lite
  // to avoid hitting the 503 transient spikes under high demand.
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.1-pro-preview",
    "gemini-2.5-pro"
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const maxRetries = 2; // At most 2 attempts for transient network issues, 1 attempt for overloaded errors

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[CodeLens AI] Attempting generation with model "${model}" (attempt ${attempt}/${maxRetries})...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });
        console.log(`[CodeLens AI] Generation succeeded with model: "${model}"`);
        return response;
      } catch (error: any) {
        lastError = error;
        const errMsg = error?.message || String(error);
        console.warn(`[CodeLens AI] Model "${model}" attempt ${attempt} failed:`, errMsg);

        // Check if the model is overloaded, has high demand, or is unavailable.
        // If so, switch immediately to the next model without retrying.
        const isOverloaded = errMsg.includes("503") || 
                             errMsg.includes("UNAVAILABLE") || 
                             errMsg.includes("demand") ||
                             errMsg.includes("RESOURCE_EXHAUSTED") ||
                             errMsg.includes("429");

        if (isOverloaded) {
          console.warn(`[CodeLens AI] Model "${model}" is overloaded/unavailable. Switching immediately to the next fallback model...`);
          break; // Break the attempt loop to move to the next model
        }

        const isTransientNetwork = errMsg.includes("timeout") || errMsg.includes("fetch failed");
        if (isTransientNetwork && attempt < maxRetries) {
          const delay = 500;
          console.log(`[CodeLens AI] Transient network issue. Retrying "${model}" in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          // For other errors or if we exhausted retries, break to try the next model
          console.warn(`[CodeLens AI] Moving to the next fallback model...`);
          break;
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content after trying all fallback models.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up body parsers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { code, language, errorMsg } = req.body;

      if (!code || !language) {
        return res.status(400).json({ error: "Code and language are required fields." });
      }

      // Prepare prompt
      const prompt = `
        You are CodeLens AI, an expert software developer and technical educator specialized in helping beginners understand syntax errors, compiler diagnostics, logical bugs, and optimal algorithm selection.

        The user has selected the programming language: "${language}".
        
        Here is the user's code:
        \`\`\`${language}
        ${code}
        \`\`\`

        ${errorMsg ? `The user also provided this specific compiler or runtime error message:\n\`\`\`\n${errorMsg}\n\`\`\`` : "The user did not provide an error message. Inspect the code for compilation errors, syntax errors, logical bugs, edge cases, infinite loops, or potential performance issues."}

        Please analyze this submission. Even if the code is correct, find areas of improvement, suggest optimal coding patterns, provide alternative solutions (e.g., comparing time complexities), recommend educational YouTube search topics, and propose matching LeetCode/interview style questions.

        You MUST respond with a valid JSON matching the response schema provided.
      `;

      // Define response schema to get consistent, highly structured data
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          errorSummary: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Title of the error, bug, or optimization area identified (e.g., 'SyntaxError: Missing Semicolon' or 'Logical Bug: Off-by-One Error')" },
              location: { type: Type.STRING, description: "File path, function name, line number, or code block where the main issue occurs" },
              severity: { type: Type.STRING, description: "Classification of the problem: 'error' (compile/syntax/runtime error), 'warning' (bad practice/inefficient), 'bug' (logical flaw), or 'none' (optimizing clean code)" }
            },
            required: ["title", "location", "severity"]
          },
          explanation: {
            type: Type.OBJECT,
            properties: {
              whatIsIt: { type: Type.STRING, description: "A simple, beginner-friendly explanation of what this compiler error, bug, or warning means conceptually (e.g., like explaining to a 10-year-old)." },
              whyItHappened: { type: Type.STRING, description: "Specifically why this occurred in the user's pasted code. Reference the exact lines, variable names, or missing symbols." }
            },
            required: ["whatIsIt", "whyItHappened"]
          },
          fixedCode: { type: Type.STRING, description: "The complete corrected version of the code that resolves the syntax, compiler, or logic error." },
          videoRecommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Educational video topic or title (e.g., 'C++ Pointers and References Crash Course')" },
                channelOrTopic: { type: Type.STRING, description: "The general programming topic or well-known educational creator/platform (e.g., 'freeCodeCamp', 'Computerphile', 'Programming with Mosh')" },
                searchQuery: { type: Type.STRING, description: "YouTube search query string to find this video concept (e.g., 'C++ pointers references tutorial')" },
                description: { type: Type.STRING, description: "How this video helps explain the concept or solve similar issues" }
              },
              required: ["title", "channelOrTopic", "searchQuery", "description"]
            },
            description: "2-3 high-quality YouTube recommendations related to the coding concept or the language error."
          },
          interviewQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "The title of a similar coding interview question (e.g., 'Valid Parentheses', 'Two Sum')" },
                difficulty: { type: Type.STRING, description: "Difficulty level: 'Easy', 'Medium', or 'Hard'" },
                relevance: { type: Type.STRING, description: "Why this interview question is relevant to the data structure or algorithm involved in this error/code" }
              },
              required: ["title", "difficulty", "relevance"]
            },
            description: "2-3 relevant algorithmic interview questions that use the same core concepts or structural patterns."
          },
          approaches: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the approach (e.g., 'Brute Force', 'Optimized Hash Table', 'Two-Pointer Technique')" },
                description: { type: Type.STRING, description: "Brief overview of how this approach works conceptually" },
                code: { type: Type.STRING, description: "The full, compilable code snippet implementing this approach in the selected language" },
                timeComplexity: { type: Type.STRING, description: "Time complexity using Big O notation (e.g., 'O(N^2)', 'O(N)')" },
                timeComplexityReason: { type: Type.STRING, description: "Detailed, brief, and crystal-clear explanation of why this specific time complexity exists (e.g., 'A single loop that iterates N times', or 'Nested loops where outer runs N times and inner runs N times')." },
                spaceComplexity: { type: Type.STRING, description: "Space complexity using Big O notation (e.g., 'O(1)', 'O(N)')" },
                spaceComplexityReason: { type: Type.STRING, description: "Detailed, brief, and crystal-clear explanation of why this specific space complexity exists (e.g., 'In-place sorting with no auxiliary memory', or 'A hash map storing up to N entries')." },
                pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of advantages of this pattern" },
                cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of disadvantages of this pattern" }
              },
              required: ["name", "description", "code", "timeComplexity", "timeComplexityReason", "spaceComplexity", "spaceComplexityReason", "pros", "cons"]
            },
            description: "At least two distinct algorithmic/design approaches (e.g., iterative vs recursive, or brute force vs optimal) with full code and Big-O complexities to teach best practices."
          }
        },
        required: ["errorSummary", "explanation", "fixedCode", "videoRecommendations", "interviewQuestions", "approaches"]
      };

      // Call Gemini API using robust retry and fallback mechanism
      const response = await generateWithRetryAndFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.2, // Low temperature for more deterministic/factual code explanation
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response content from Gemini API.");
      }

      const analysisResult = JSON.parse(responseText.trim());
      res.json(analysisResult);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({
        error: "Failed to analyze code due to an internal server error.",
        details: error.message || error,
      });
    }
  });

  // Serve static files / Vite SPA routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CodeLens AI] Server running at http://localhost:${PORT}`);
  });
}

startServer();
