import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { QdrantClient } from "@qdrant/js-client-rest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as db from "./src/db/postgresDb";

// Load environment variables for local testing
dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "enyi_path_jwt_secret_key_token_123";

// Authentication middleware
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized: Missing auth header" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing token string" });
  }

  if (token === "guest-token") {
    req.userId = -1;
    req.isGuest = true;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired session token" });
  }
}

// Qdrant setup
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

let qdrantClient: QdrantClient | null = null;
const COLLECTION_NAME = "uscis_civics_collection";
let isQdrantInitialized = false;

function getQdrantClient(): QdrantClient | null {
  if (!qdrantClient && QDRANT_URL) {
    try {
      qdrantClient = new QdrantClient({
        url: QDRANT_URL,
        apiKey: QDRANT_API_KEY || undefined,
      });
      console.log("Qdrant connected:", QDRANT_URL);
    } catch (err) {
      console.error("Failed to construct QdrantClient:", err);
    }
  }
  return qdrantClient;
}

// Initialize Google GenAI client (lazy load-safe checked, API keys fallback handled gracefully)
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not defined.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "Enyi-Path-Server",
      },
    },
  });
};

// USCIS study content used for retrieval and fallback responses.
export interface KnowledgeChunk {
  chunk_id: number;
  text: string;
  document: string;
  url: string;
}

const USCIS_KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    chunk_id: 101,
    text: "The Constitution is the supreme law of the land. It defines the government structure (Executive, Legislative, and Judicial branches) and contains 27 amendments, starting with the Bill of Rights which protects the fundamental freedoms of individual Americans.",
    document: "Official USCIS Guide - Section 1: American Democracy",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  },
  {
    chunk_id: 102,
    text: "The First Amendment protects five fundamental individual rights and public freedoms: freedom of religion, freedom of speech, freedom of the press, the right to peaceably assemble, and the right to petition the government for a redress of grievances.",
    document: "Official USCIS Guide - Section 1: System of Government",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  },
  {
    chunk_id: 103,
    text: "The principle of 'Rule of Law' mandates that everyone, including leaders, lawmakers, and government officials, must obey the law. No citizen or officer is above the Constitution or state statutes.",
    document: "Official USCIS Guide - Section 1: American Democracy",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  },
  {
    chunk_id: 104,
    text: "We elect a U.S. Senator for six (6) years. There are two Senators for each state, totaling 100 Senators. The House of Representatives has 435 voting members, elected every two (2) years. The number of Representatives for each state is based on state population.",
    document: "Official USCIS Guide - Section 2: Legislative Branch",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  },
  {
    chunk_id: 105,
    text: "The President is elected for a four (4) year term. We vote for the President in November. The President is the head of the Executive Branch and Commander in Chief of the military. If the President can no longer serve, the Vice President becomes President.",
    document: "Official USCIS Guide - Section 2: Executive Branch",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  },
  {
    chunk_id: 106,
    text: "The judicial branch reviews laws, explains laws, resolves disputes, and decides if laws or executive actions go against the United States Constitution. The Supreme Court is the highest court in the nation and features nine (9) Justices presided over by the Chief Justice.",
    document: "Official USCIS Guide - Section 2: Judicial Branch",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  },
  {
    chunk_id: 107,
    text: "Under our Constitution, some powers belong exclusively to the federal government (the delegated powers: to print money, declare war, raise an army, and draft treaties). Some powers belong to state governments (police/fire protection, schools, and issuing driver's licenses).",
    document: "Official USCIS Guide - Section 1: System of Government",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  },
  {
    chunk_id: 108,
    text: "During the Colonial Period, colonists came to America for political liberty, religious freedom, economic opportunity, and to escape persecution. They fought the British because of high taxes without representation ('Taxation without Representation') and quartering of British soldiers.",
    document: "Official USCIS Guide - Section 3: American History",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  },
  {
    chunk_id: 109,
    text: "The Declaration of Independence was written by Thomas Jefferson and adopted on July 4, 1776. It declared that colonists were free from Great Britain and claimed three unalienable rights: Life, Liberty, and the pursuit of Happiness.",
    document: "Official USCIS Guide - Section 3: American History",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  },
  {
    chunk_id: 110,
    text: "The Constitutional Convention met in Philadelphia in 1787 to draft the Constitution. Standard advocates called Federalists wrote essays called 'The Federalist Papers' (signed under 'Publius' by James Madison, Alexander Hamilton, and John Jay) to support its ratification.",
    document: "Official USCIS Guide - Section 3: American History",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  },
  {
    chunk_id: 111,
    text: "Abraham Lincoln served as President during the Civil War (1861-1865). His key accomplishments were preserving the Union, freeing slaves via the Emancipation Proclamation (which declared freedom for slaves in Confederate states), and delivering the Gettysburg Address.",
    document: "Official USCIS Guide - Section 3: Civil War Period",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  },
  {
    chunk_id: 112,
    text: "World War II was fought by the United States against the Axis powers (Germany, Italy, Japan) between 1941 and 1945, triggered by the attack on Pearl Harbor. Leaders included President Franklin D. Roosevelt and General Dwight D. Eisenhower.",
    document: "Official USCIS Guide - Section 3: American History - 1900s",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  },
  {
    chunk_id: 113,
    text: "The Civil Rights Movement was a struggle led by Martin Luther King Jr. and other leaders to end racial discrimination, guarantee voting equality, and secure equal civil rights for African Americans under the Civil Rights Act.",
    document: "Official USCIS Guide - Section 3: Recent History",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  },
  {
    chunk_id: 114,
    text: "Susan B. Anthony was a pioneer in women's rights, voting rights, and the suffrage movement. Her decades of advocacy led to the ultimate ratification of the 19th Amendment, which granted women the constitutional right to vote.",
    document: "Official USCIS Guide - Section 3: American History - 1800s",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  },
  {
    chunk_id: 115,
    text: "There are four amendments to the Constitution about who can vote: the 15th (no racial barrier), the 19th (women can vote), the 24th (no poll taxes), and the 26th (lowering the voting age to eighteen or older).",
    document: "Official USCIS Guide - Section 1: Constitutional Amendments",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources"
  }
];

async function ensureQdrantCollectionReady(client: QdrantClient): Promise<boolean> {
  if (isQdrantInitialized) return true;
  try {
    const collectionsRes = await client.getCollections();
    const exists = collectionsRes.collections.some(c => c.name === COLLECTION_NAME);
    
    if (!exists) {
      console.log(`Qdrant collection '${COLLECTION_NAME}' not found, creating it...`);
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 768,
          distance: "Cosine"
        }
      });

      console.log("Collection created. Generating embeddings and uploading...");
      
      const ai = getAiClient();
      const points = [];
      
      for (const chunk of USCIS_KNOWLEDGE_BASE) {
        // Generate embedding
        const embRes = await ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: chunk.text
        });

        const vector = embRes.embeddings?.[0]?.values;
        if (vector && vector.length > 0) {
          points.push({
            id: chunk.chunk_id,
            vector: vector,
            payload: {
              chunk_id: chunk.chunk_id,
              text: chunk.text,
              document: chunk.document,
              url: chunk.url
            }
          });
        }
      }

      if (points.length > 0) {
        await client.upsert(COLLECTION_NAME, {
          wait: true,
          points: points
        });
        console.log(`Uploaded ${points.length} knowledge points to Qdrant.`);
      }
    }
    isQdrantInitialized = true;
    return true;
  } catch (err) {
    console.warn("Failed setting up Qdrant collection, falling back to local simulation.", err);
    return false;
  }
}

async function retrieveKnowledgeChunks(query: string): Promise<{ chunk_id: number; text: string; document: string; url: string; similarity: number; source: string }[]> {
  const client = getQdrantClient();
  if (client) {
    try {
      const isReady = await ensureQdrantCollectionReady(client);
      if (isReady) {
        const ai = getAiClient();
        const embRes = await ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: query || "USCIS immigration study guide"
        });
        const queryVector = embRes.embeddings?.[0]?.values;
        if (queryVector && queryVector.length > 0) {
          const searchResult = await client.search(COLLECTION_NAME, {
            vector: queryVector,
            limit: 2
          });
          if (searchResult && searchResult.length > 0) {
            // Use Qdrant results when available.
            return searchResult.map(res => {
              const payload = res.payload as any;
              return {
                chunk_id: payload?.chunk_id || 101,
                text: payload?.text || "",
                document: payload?.document || "",
                url: payload?.url || "",
                similarity: Math.round((res.score || 0.8) * 100) / 100,
                source: "Qdrant"
              };
            });
          }
        }
      }
    } catch (qdrantErr) {
      console.warn("Qdrant lookup failed, using local data.", qdrantErr);
    }
  }

  // Fall back to local questions if retrieval fails.
  if (!query) {
    return [
      { ...USCIS_KNOWLEDGE_BASE[0], similarity: 0.9, source: "local fallback" }
    ];
  }
  const words = query.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  if (words.length === 0) {
    return [
      { ...USCIS_KNOWLEDGE_BASE[0], similarity: 0.85, source: "local fallback" }
    ];
  }

  const scored = USCIS_KNOWLEDGE_BASE.map(chunk => {
    const chunkWords = chunk.text.toLowerCase();
    const docWords = chunk.document.toLowerCase();
    let matches = 0;
    words.forEach(w => {
      if (chunkWords.includes(w) || docWords.includes(w)) {
        matches += 1;
      }
    });
    // Simple heuristic similarity scoring
    const score = Math.min(0.99, Math.max(0.12, (matches / words.length) + (matches > 0 ? 0.35 : 0)));
    return { ...chunk, similarity: Math.round(score * 100) / 100, source: "local fallback" };
  });

  scored.sort((a, b) => b.similarity - a.similarity);

  // Return the top matched chunks
  const topMatches = scored.filter(s => s.similarity > 0.25);
  if (topMatches.length > 0) {
    return topMatches.slice(0, 2);
  }
  return [scored[0]];
}

// Check for valid configured API keys (excluding default placeholders)
function getActiveApiKey(): "gemini" | null {
  const geminiKey = process.env.GEMINI_API_KEY;

  const hasGemini = geminiKey && geminiKey !== "MY_GEMINI_API_KEY" && geminiKey.trim() !== "";

  if (hasGemini) return "gemini";
  return null;
}

function parseTranslationArray(rawText: string): string[] {
  const trimmed = rawText.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(trimmed);
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw new Error("Translation response was not a string array.");
  }
  return parsed;
}

interface OfflineQuestion {
  question: string;
  expectedKeywords: string[];
  acceptedAnswer: string;
}

const OFFLINE_QUESTIONS: OfflineQuestion[] = [
  {
    question: "Can you state your full legal name and define what 'naturalization' means?",
    expectedKeywords: ["citizen", "become", "legal", "process"],
    acceptedAnswer: "The legal process to become a United States citizen."
  },
  {
    question: "Have you taken any trips outside of the United States in the last five years?",
    expectedKeywords: ["yes", "no", "trip", "travel"],
    acceptedAnswer: "Yes / No travel history matching your N-400 records."
  },
  {
    question: "Alright. Let us transition to the Civics test. Question 1: What is the supreme law of the land?",
    expectedKeywords: ["constitution"],
    acceptedAnswer: "The Constitution."
  },
  {
    question: "Question 2: What does the Constitution do?",
    expectedKeywords: ["government", "set", "basic", "rights"],
    acceptedAnswer: "Sets up the government, defines the government, or protects basic rights of Americans."
  },
  {
    question: "Question 3: The idea of self-government is in the first three words of the Constitution. What are these words?",
    expectedKeywords: ["we", "people"],
    acceptedAnswer: "We the People."
  },
  {
    question: "Question 4: How many amendments does the Constitution have?",
    expectedKeywords: ["27", "twenty-seven", "twenty", "seven"],
    acceptedAnswer: "27 (twenty-seven)."
  },
  {
    question: "Question 5: What is one right or freedom from the First Amendment?",
    expectedKeywords: ["speech", "religion", "assembly", "press", "petition"],
    acceptedAnswer: "Speech, religion, assembly, press, or petition the government."
  },
  {
    question: "Question 6: Who was President during the Civil War?",
    expectedKeywords: ["lincoln", "abraham"],
    acceptedAnswer: "Abraham Lincoln."
  },
  {
    question: "Question 7: Name one war fought by the United States in the 1800s.",
    expectedKeywords: ["civil", "1812", "mexican", "spanish"],
    acceptedAnswer: "Civil War, War of 1812, Mexican-American War, or Spanish-American War."
  },
  {
    question: "Question 8: What is one responsibility that is only for United States citizens?",
    expectedKeywords: ["jury", "vote"],
    acceptedAnswer: "Serve on a jury or vote in a federal election."
  },
  {
    question: "Alright, let us proceed to the moral alignment section. Have you ever claimed to be a U.S. citizen in writing or any other way?",
    expectedKeywords: ["no", "never", "false"],
    acceptedAnswer: "No, never."
  },
  {
    question: "Final question: Are you willing to take the full Oath of Allegiance to the United States?",
    expectedKeywords: ["yes", "willing", "promise"],
    acceptedAnswer: "Yes, I am willing."
  }
];

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.post("/api/translate", authenticate, async (req: any, res: any) => {
  try {
    const { texts, targetLang } = req.body;

    if (!Array.isArray(texts) || texts.some((text) => typeof text !== "string")) {
      return res.status(400).json({ error: "texts must be an array of strings" });
    }

    if (!targetLang || targetLang === "English") {
      return res.json({ translations: texts });
    }

    if (getActiveApiKey() === null) {
      return res.status(503).json({ error: "Translation requires GEMINI_API_KEY." });
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Translate each string into ${targetLang}. Keep USCIS/civics proper nouns and official terms recognizable. Return only a valid JSON array of strings in the same order, with no Markdown.\n\n${JSON.stringify(texts)}`,
            },
          ],
        },
      ],
      config: {
        temperature: 0.1,
      },
    });

    const translations = parseTranslationArray(response.text || "[]");
    return res.json({ translations });
  } catch (error: any) {
    console.error("Translation Error:", error);
    return res.status(500).json({ error: error.message || "Failed to translate quiz text." });
  }
});

// --- AUTHENTICATION ENDPOINTS ---

// Register
app.post("/api/auth/register", async (req: any, res: any) => {
  try {
    const { email, password, profile_name, exam_date } = req.body;
    if (!email || !password || !profile_name) {
      return res.status(400).json({ error: "Missing email, password, or profile name" });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await db.createUser(email, passwordHash, profile_name, exam_date);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });

    const stats = await db.getUserStats(user.id);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        profile_name: user.profile_name,
        exam_date: user.exam_date,
      },
      stats: {
        masteredQuestionsCount: stats.mastered_count,
        activeStreak: stats.active_streak,
        lastQuizScore: stats.last_quiz_score,
        totalTimeStudied: stats.total_time_studied,
        examDate: user.exam_date,
        studyPoints: stats.study_points,
      }
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    return res.status(500).json({ error: "Failed to register user account." });
  }
});

// Login
app.post("/api/auth/login", async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
    const stats = await db.getUserStats(user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        profile_name: user.profile_name,
        exam_date: user.exam_date,
      },
      stats: {
        masteredQuestionsCount: stats.mastered_count,
        activeStreak: stats.active_streak,
        lastQuizScore: stats.last_quiz_score,
        totalTimeStudied: stats.total_time_studied,
        examDate: user.exam_date,
        studyPoints: stats.study_points,
      }
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Failed to sign in." });
  }
});

// Me endpoint to verify token and load user state
app.get("/api/auth/me", authenticate, async (req: any, res: any) => {
  try {
    if (req.userId === -1 || req.isGuest) {
      return res.json({
        user: {
          id: "guest",
          email: "guest@enyi.local",
          profile_name: "Guest",
          exam_date: "",
          isGuest: true,
        },
        stats: {
          masteredQuestionsCount: 0,
          activeStreak: 1,
          lastQuizScore: 0,
          totalTimeStudied: 0,
          examDate: "",
          studyPoints: 0,
        }
      });
    }

    const user = await db.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const stats = await db.getUserStats(user.id);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        profile_name: user.profile_name,
        exam_date: user.exam_date,
      },
      stats: {
        masteredQuestionsCount: stats.mastered_count,
        activeStreak: stats.active_streak,
        lastQuizScore: stats.last_quiz_score,
        totalTimeStudied: stats.total_time_studied,
        examDate: user.exam_date,
        studyPoints: stats.study_points,
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to reload profile session" });
  }
});

// --- USER SYNC ENDPOINTS ---

// Stats (GET / POST)
app.get("/api/user/stats", authenticate, async (req: any, res: any) => {
  try {
    const user = await db.getUserById(req.userId);
    const stats = await db.getUserStats(req.userId);
    return res.json({
      masteredQuestionsCount: stats.mastered_count,
      activeStreak: stats.active_streak,
      lastQuizScore: stats.last_quiz_score,
      totalTimeStudied: stats.total_time_studied,
      examDate: user?.exam_date || "",
      studyPoints: stats.study_points,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load statistics" });
  }
});

app.post("/api/user/stats", authenticate, async (req: any, res: any) => {
  try {
    const { masteredQuestionsCount, activeStreak, lastQuizScore, totalTimeStudied, studyPoints } = req.body;
    
    const dbUpdates: any = {};
    if (masteredQuestionsCount !== undefined) dbUpdates.mastered_count = masteredQuestionsCount;
    if (activeStreak !== undefined) dbUpdates.active_streak = activeStreak;
    if (lastQuizScore !== undefined) dbUpdates.last_quiz_score = lastQuizScore;
    if (totalTimeStudied !== undefined) dbUpdates.total_time_studied = totalTimeStudied;
    if (studyPoints !== undefined) dbUpdates.study_points = studyPoints;

    const stats = await db.updateUserStats(req.userId, dbUpdates);
    const user = await db.getUserById(req.userId);

    return res.json({
      masteredQuestionsCount: stats.mastered_count,
      activeStreak: stats.active_streak,
      lastQuizScore: stats.last_quiz_score,
      totalTimeStudied: stats.total_time_studied,
      examDate: user?.exam_date || "",
      studyPoints: stats.study_points,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update statistics" });
  }
});

// Sessions (GET / POST / CLEAR)
app.get("/api/user/sessions", authenticate, async (req: any, res: any) => {
  try {
    const list = await db.getStudySessions(req.userId);
    const formatted = list.map(s => ({
      id: s.id,
      date: s.date,
      module: s.module,
      score: s.score,
      totalQuestions: s.total_questions,
      type: s.type,
    }));
    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: "Failed to get study sessions" });
  }
});

app.post("/api/user/sessions", authenticate, async (req: any, res: any) => {
  try {
    const { id, date, module, score, totalQuestions, type } = req.body;
    if (!module || score === undefined || totalQuestions === undefined || !type) {
      return res.status(400).json({ error: "Missing study session fields" });
    }

    const saved = await db.createStudySession(req.userId, {
      id: id || "ses_" + Date.now(),
      date: date || "Just Now",
      module,
      score,
      total_questions: totalQuestions,
      type,
    });

    return res.json({
      id: saved.id,
      date: saved.date,
      module: saved.module,
      score: saved.score,
      totalQuestions: saved.total_questions,
      type: saved.type,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to record study session" });
  }
});

app.post("/api/user/sessions/clear", authenticate, async (req: any, res: any) => {
  try {
    await db.clearStudySessions(req.userId);
    return res.json({ success: true, message: "Study sessions cleared" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to clear study sessions" });
  }
});

// Flashcards (GET / POST / RESET)
app.get("/api/user/flashcards", authenticate, async (req: any, res: any) => {
  try {
    const masteries = await db.getFlashcardMasteries(req.userId);
    const map: Record<number, boolean> = {};
    masteries.forEach(m => {
      map[m.flashcard_id] = m.is_mastered;
    });
    return res.json(map);
  } catch (err) {
    return res.status(500).json({ error: "Failed to get flashcard masteries" });
  }
});

app.post("/api/user/flashcards/:id", authenticate, async (req: any, res: any) => {
  try {
    const cardId = parseInt(req.params.id);
    const { isMastered } = req.body;
    if (isNaN(cardId) || isMastered === undefined) {
      return res.status(400).json({ error: "Invalid flashcard mastery updates" });
    }

    const row = await db.setFlashcardMastery(req.userId, cardId, isMastered);
    return res.json({
      flashcard_id: row.flashcard_id,
      is_mastered: row.is_mastered,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update flashcard mastery" });
  }
});

app.post("/api/user/flashcards/reset", authenticate, async (req: any, res: any) => {
  try {
    await db.resetFlashcardMasteries(req.userId);
    return res.json({ success: true, message: "Flashcard masteries reset" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to reset flashcard masteries" });
  }
});

app.delete("/api/user", authenticate, async (req: any, res: any) => {
  try {
    await db.deleteUser(req.userId);
    return res.json({ success: true, message: "User account and all associated study data deleted successfully" });
  } catch (err) {
    console.error("Failed to delete user account:", err);
    return res.status(500).json({ error: "Failed to delete user account" });
  }
});

// Chat endpoint
app.post("/api/chat", authenticate, async (req: any, res: any) => {
  try {
    const { messages, context, mode, style, language, personality, drillType } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages array provided." });
    }

    const lastUserMsg = messages[messages.length - 1];
    const userQuery = lastUserMsg ? lastUserMsg.content : "";
    const retrievedSources = await retrieveKnowledgeChunks(userQuery);

    // Dynamic key inspection
    const activeKeyType = getActiveApiKey();

    if (activeKeyType === null) {
      console.log("No API key found, using fallback content.");

      // If active mode is Mock Interview, let's run the stateful static sequence
      if (mode === "interview") {
        const userMessages = messages.filter((m: any) => m.role === "user");
        const userMsgCount = userMessages.length;

        // Welcome answer checking
        if (userMsgCount <= 1) {
          const reply = `AI service is unavailable. Running the mock interview in offline mode. Let's begin!

Officer Enyi: "Can you state your full legal name and define what 'naturalization' means?"`;
          return res.json({ content: reply, sources: [] });
        }

        const lastUserAnsIndex = userMsgCount - 2; // Index of the question the user just answered
        if (lastUserAnsIndex < OFFLINE_QUESTIONS.length) {
          const lastQ = OFFLINE_QUESTIONS[lastUserAnsIndex];
          const lastUserText = userMessages[userMessages.length - 1].content.toLowerCase();
          const isMatched = lastQ.expectedKeywords.some(kw => lastUserText.includes(kw));

          let feedback = "";
          if (personality === "real") {
            feedback = `Officer Enyi: "Okay. Moving forward."`;
          } else if (personality === "friendly") {
            feedback = isMatched
              ? `Officer Enyi: "Correct."`
              : `Officer Enyi: "Your answer is close. The accepted USCIS answer is: '${lastQ.acceptedAnswer}'."`;
          } else {
            // Tutor personality
            feedback = isMatched
              ? `Officer Enyi: "Wonderful! That is correct. (Accepted answer: '${lastQ.acceptedAnswer}'). Excellent work!"`
              : `Officer Enyi: "Your answer is close. The accepted study answer is: '${lastQ.acceptedAnswer}'. Keep polishing your memory!"`;
          }

          const nextQIndex = lastUserAnsIndex + 1;
          if (nextQIndex < OFFLINE_QUESTIONS.length) {
            const nextQ = OFFLINE_QUESTIONS[nextQIndex];
            const reply = `${feedback}\n\nOfficer Enyi: "${nextQ.question}"`;
            return res.json({ content: reply, sources: retrievedSources });
          } else {
            const reply = `${feedback}\n\nOfficer Enyi: "Thank you. This completes the questions for your offline mock interview. I have prepared your readiness feedback. Please press the 'End Interview & Render Report' button to see your session report."`;
            return res.json({ content: reply, sources: [] });
          }
        } else {
          const reply = `Officer Enyi: "Interview is already complete. Please press the 'End Interview & Render Report' button to see your office simulation report!"`;
          return res.json({ content: reply, sources: [] });
        }
      }

      if (mode === "quiz-help" && context) {
        const choices = Array.isArray(context.choices || context.options)
          ? (context.choices || context.options)
          : [];
        const correctIndex = typeof context.correctAnswer === "string"
          ? context.correctAnswer.toUpperCase().charCodeAt(0) - 65
          : -1;
        const correctChoice = choices[correctIndex] || context.correctAnswer || "the accepted USCIS answer";
        const selectedText = context.selectedAnswer
          ? `\nYour selected answer: ${context.selectedAnswer}`
          : "";

        return res.json({
          content: `Enyi AI could not reach the live tutor service, but here is the study explanation for this quiz question:

Question: ${context.question}
Correct answer: ${correctChoice}${selectedText}

${context.explanation || "Review the official USCIS civics concept behind this answer, then try explaining it in your own words before moving on."}`,
          sources: retrievedSources,
        });
      }

      // If tutoring / general chat help mode
      const topMatch = retrievedSources[0];
      let reply = "";

      if (topMatch && topMatch.similarity > 0.4) {
        // Level 2: RAG-only fallback
        reply = `AI tutor is unavailable right now. Here are the official USCIS study notes:

💡 **Grounded Knowledge Reference:**
"${topMatch.text}"

📖 **Study Source:** ${topMatch.document}
🔗 [Official study reference source](${topMatch.url})

*To enable the AI tutor, add your GEMINI_API_KEY to your .env file.*`;
      } else {
        // Level 3: Offline/basic keyword match fallback
        const lowerQuery = userQuery.toLowerCase();
        const matchedQ = OFFLINE_QUESTIONS.find(q => q.expectedKeywords.some(kw => lowerQuery.includes(kw)));

        if (matchedQ) {
          reply = `💡 Study reference (offline mode)
Your question or answer is close. Review the official USCIS guidelines:

Accepted Answer: "${matchedQ.acceptedAnswer}"
Context Study Question: "${matchedQ.question}"`;
        } else {
          reply = `Offline / Basic study companion mode:
AI reasoning services are currently unconfigured. Try using specific civics keywords like "supreme law", "First Amendment", "Civil War", "Lincoln", or "naturalization".

Here is standard foundational USCIS knowledge:
"${USCIS_KNOWLEDGE_BASE[0].text}"`;
        }
      }

      return res.json({ content: reply, sources: retrievedSources });
    }

    const ai = getAiClient();

    // Map roles to standard roles ('user' or 'model')
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "model" || m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Build the system instructions dynamic to the context and mode
    let systemInstruction = `You are Enyi AI, a direct and knowledgeable USCIS Civics tutor.
Explain concepts clearly, using plain English. Do not add generic motivational praise before or after every answer.
Only encourage the learner when it feels natural and relevant.
Focus on the citizenship concept first. Use the "make, carry out, explain" structure if helpful.
Keep answers warm but direct and concise.

When replying:
- Use direct, readable sentences.
- Avoid overly dense legalistic text; explain historical stories in an accessible, vivid storytelling format.
- If providing historical facts (such as the Civil War, Abraham Lincoln, or the Constitution), briefly explain the 'why' to help them remember.
- Limit response length to be readable on mobile cards (maximum 2-3 short paragraphs). Use bolding and structured bullet points to break down timelines or rules.`;

    const shouldTranslate = language && language !== "English";
    if (shouldTranslate) {
      systemInstruction += `\n\nLANGUAGE RESPONSE RULE:
- Respond primarily in ${language}.
- Keep important USCIS/civics terms in English with the ${language} explanation next to them in parentheses so the learner can still memorize official terms.
- Do not translate official proper nouns (e.g. "Congress", "Senate", "Constitution") in a way that changes their meaning.
- Keep the answer natural, simple, and helpful for a citizenship learner.`;
    }

    if (mode === "quiz-help" && context) {
      if (style === "simple") {
        systemInstruction += `\n\nEXPLANATION STYLES: "Explain Like I'm New to America".
- Explain the concept extremely simply, from absolute scratch, assuming the user possesses ZERO prior knowledge of U.S. history, geography, or political culture.
- Use basic vocabulary, step-by-step logic, and gentle storytelling. Avoid complex historical references unless you explain them.`;
      } else {
        systemInstruction += `\n\nEXPLANATION STYLES: "Standard Clear Explanation".
- Provide an educational, thorough explanation detailing the historical background, facts, and relevance of the question.`;
      }

      systemInstruction += `\n\nContext: The user is currently stuck on a practice question.
Question Context: ${JSON.stringify(context)}
Explain the quiz question clearly in simple citizenship-test language.
Do not just give the answer. If the correct answer is available, explain why it is correct and why the learner should remember it.
If the learner selected an answer, briefly connect your explanation to that selection without being harsh.
Identify the question, help them understand the history behind it, and provide a short memory trick or hint when useful.`;
    } else if (mode === "interview") {
      let personalityBlock = "";
      if (personality === "real") {
        personalityBlock = `PERSONALITY / STYLE: MODE 1 - Real USCIS Interview (Default)
- Act strictly as a highly realistic, professional, respectful, but completely neutral naturalization officer at the USCIS.
- STRICTLY DO NOT provide any correctness feedback, evaluations, praises, validation, explanations, or scores inside the dialogue! The words "Correct", "Incorrect", "Right", "Wrong", "Accurate", "Perfect" or similar evaluative remarks are STRICTLY FORBIDDEN during the active interview.
- React to any answer from the applicant with polite, neutral transition remarks such as: "Okay.", "Thank you.", "Understood.", "Alright.", or "Moving forward." and immediately ask the next question.
- No congratulatory or encouraging lines. The applicant must be kept in the dark whether they passed or failed any individual question, exactly mimicking real USCIS security conditions of testing.
- Conduct realistic follow-up questions instead of any advice or reviews. If they tell you where they work, ask: "How long have you worked there?" or "What are your primary duties?"`;
      } else if (personality === "friendly") {
        personalityBlock = `PERSONALITY / STYLE: MODE 2 - Practice Interview (Minimal Feedback)
- Act as a supportive but concise officer.
- Provide MINIMAL, clear correctness feedback after each answer. Start your turn with a brief 1-word tag like "Correct." or "Incorrect. (with the right answer)." followed immediately by "Next question."
- STRICTLY DO NOT write long explanations, historical essays, mnemonics, or hints after their answers. Keep feedback limited strictly to correct/incorrect correctness and immediately move onto the next question. Example: 'Correct. Let's move to the next question:'`;
      } else {
        personalityBlock = `PERSONALITY / STYLE: MODE 3 - Citizenship Tutor (Detailed Feedback & Tips)
- Act as an ultra-encourgaging, friendly, and patient citizenship tutor.
- Celebrate correct answers enthusiastically!
- Provide detailed educational explanations, historical source background, historical stories, memory tips, and visual mnemonics right after they answer to help them fully master the citizenship knowledge behind the question.`;
      }

      let drillBlock = "";
      if (drillType === "civics") {
        drillBlock = `DRILL FOCUS: Civics-Only Practice
- Ask oral civics questions sequentially from the official USCIS list of 100 questions.
- Do not ask biography or travel-related questions. Conduct a quick-fire civics round.`;
      } else if (drillType === "personal") {
        drillBlock = `DRILL FOCUS: N-400 Personal Information & Biography
- Ask personal biographical questions based on the N-400 application. Ask for their official name, contact details, residence background, and dates of legal permanency.`;
      } else if (drillType === "travel") {
        drillBlock = `DRILL FOCUS: Travel History Practice
- Ask about trips outside of the United States in the last five years. Ask questions like: "How many trips have you taken?", "Where did you go?", "When did you leave?", "When did you return?", "How many total days outside the US?". Check chronological consistency clearly.`;
      } else if (drillType === "employment") {
        drillBlock = `DRILL FOCUS: Employment and School Verification
- Check employment details: "Where do you work?", "What do you do there?", "How long have you been employed?", or schooling records.`;
      } else if (drillType === "family") {
        drillBlock = `DRILL FOCUS: Marriage and Family History
- Ask family history from N-405: "What is your marital status?", "Is your spouse a US citizen?", "How did you meet?", or details about children.`;
      } else if (drillType === "all_yes_no" || drillType === "moral") {
        drillBlock = `DRILL FOCUS: Good Moral Character Yes/No questions
- Ask standard security/eligibility Yes/No questions.
- CRITICAL addition: Occasionally ask meaning-test sub-questions. For example: If they answer "No" to a question, ask: "What does 'claimed' mean?", "What does 'genocide' mean?", or "What does 'Title of Nobility' mean?" to test their English definition comprehension.`;
      } else if (drillType === "oath") {
        drillBlock = `DRILL FOCUS: Oath of Allegiance Practice
- Ask about allegiance, willingness to take the full Oath, willingness to beat arms, or perform noncombatant services.`;
      } else if (drillType === "reading_writing") {
        drillBlock = `DRILL FOCUS: Reading & Writing Test
- Ask them to read a short historical sentence on screen, and then give them a sentence to type/write out to mock standard USCIS literacy tests.`;
      } else {
        drillBlock = `DRILL FOCUS: Full Mock USCIS Interview Simulation
- Provide a full realistic mix: Start with brief greeting/N-400 biological data, transition to 5 civics questions, ask travel/employment history, and finish with Yes/No moral questions.`;
      }

      systemInstruction = `You are playing the role of Officer Enyi, a professional officer conducting a naturalization interview.

${personalityBlock}

${drillBlock}

INTERVIEW PATTERNS (derived from real transcript recordings of successful naturalization reviews):
- Speak like a polite, efficient government employee trying to verify facts.
- Match question length, tone, pacing, and focus on factual verification.
- Avoid overly dramatic dialog.
- Ask exactly ONE question at a time. Do not dump multiple questions in a single response. Wait for the user to reply before asking your next follow-up.`;
    }

    if (retrievedSources && retrievedSources.length > 0) {
      const sourcesText = retrievedSources.map(s => `[Qdrant Doc Reference ${s.chunk_id} - Similarity ${s.similarity}]: "${s.text}"`).join("\n");
      systemInstruction += `\n\n[RETRIEVED ANCILLARY GROUNDED CONTEXT FROM QDRANT CIVICS COLLECTION (Verify details against this link)]: \n${sourcesText}\nRespond to the applicant relying on this text to verify facts.`;
    }

    // Call Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });
    const reply = response.text || "Enyi could not respond right now. Please try again in a moment.";

    res.json({ content: reply, sources: retrievedSources });
  } catch (error: any) {
    console.error("API Error in /api/chat:", error);
    res.status(500).json({
      error: error.message || "An error occurred during AI processing.",
      details: "Make sure your API keys are set in your .env file.",
    });
  }
});

// Post-interview evaluation endpoint
app.post("/api/evaluate", authenticate, async (req: any, res: any) => {
  try {
    const { messages, isPartial } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages array provided." });
    }

    // Dynamic key inspection
    const activeKeyType = getActiveApiKey();

    if (activeKeyType === null) {
      console.log("No API key found, generating offline evaluation.");

      let correctCount = 0;
      let totalAnswered = 0;

      // Scan history to match OFFLINE_QUESTIONS
      const userMsgs = messages.filter((m: any) => m.role === "user");
      userMsgs.forEach((uMsg: any, index: number) => {
        // The first user msg is usually "Start Mock", let's skip it
        if (index === 0) return;

        const qIndex = index - 1;
        if (qIndex < OFFLINE_QUESTIONS.length) {
          totalAnswered++;
          const questionConfig = OFFLINE_QUESTIONS[qIndex];
          const userAns = uMsg.content.toLowerCase();
          const isCorrect = questionConfig.expectedKeywords.some(keyword => userAns.includes(keyword));
          if (isCorrect) {
            correctCount++;
          }
        }
      });

      // Calculate score based on civics questions answered inside simulator
      let civicsCorrect = 0;
      let civicsAnswered = 0;
      userMsgs.forEach((uMsg: any, index: number) => {
        if (index === 0) return;
        const qIndex = index - 1;
        // Civics are from qIndex 2 to 9
        if (qIndex >= 2 && qIndex <= 9) {
          civicsAnswered++;
          const userAns = uMsg.content.toLowerCase();
          const isCorrect = OFFLINE_QUESTIONS[qIndex].expectedKeywords.some(kw => userAns.includes(kw));
          if (isCorrect) {
            civicsCorrect++;
          }
        }
      });

      const civicsScore = civicsAnswered > 0 ? Math.round((civicsCorrect / civicsAnswered) * 100) : 85;
      const confidence = Math.max(50, 100 - (userMsgs.filter((m: any) => {
        const text = m.content.toLowerCase();
        return text.includes("um") || text.includes("uh") || text.includes("like") || text.includes("maybe");
      }).length * 8));

      const n400Score = totalAnswered > 2 ? 90 : 55;
      const readiness = Math.round((civicsScore + 85 + confidence + n400Score) / 4);

      const outcome = isPartial
        ? "PARTIAL_COMPLETED"
        : (readiness >= 70 ? "PASS" : "FAIL");

      const offlineReport = {
        isPartialAssessment: !!isPartial,
        score: readiness,
        outcome: outcome,
        untestedAreas: isPartial ? ["Good moral character questions", "Oath of Allegiance practice"] : [],
        breakdown: {
          civics: civicsScore,
          fluency: 85,
          confidence: confidence,
          n400: n400Score,
          readiness: readiness,
          clarity: 82
        },
        whatWentWell: [
          "Responded to several USCIS civics prompts with accurate keyword matching.",
          "Formulated direct answers showing basic English comprehension.",
          "Maintained a respectful and collaborative tone throughout the officer drill."
        ],
        areasToImprove: [
          "Practice speaking clearly without pauses such as 'um' or 'uh' (counted " + (100 - confidence) / 8 + " total hesitation markers).",
          "Prepare travel history dates with extreme precision to avoid officer drilling.",
          "Practice key vocabulary words from the N-400 moral character section."
        ],
        pronunciationRisk: {
          level: confidence < 75 ? "Medium" : "Low",
          drillWords: ["naturalization", "Constitution", "selective service", "allegiance"]
        },
        n400Vulnerabilities: isPartial ? [
          "The interview was closed early. Untested biography items constitute a general readiness risk."
        ] : [
          "Ensure you know the exact answers to the moral Yes/No character questions and can define words like 'allegiance' precisely."
        ],
        naturalness: {
          score: confidence,
          rehearsedText: userMsgs[userMsgs.length - 1]?.content || "Yes officer.",
          preferredText: "You responded respectfully. Keep your responses crisp, direct, and factual."
        },
        followUpQuestions: [
          "How do you support yourself? Describe your current job duties.",
          "What is the physical address of your current workplace?",
          "Can you explain why you want to become a United States citizen?"
        ],
        confidenceNotes: `Candidate answered with relatively few filler words. Detected ${userMsgs.length - (totalAnswered - correctCount)} correct matching sequences in offline lookup.`,
        officerNotes: `[OFFLINE SUPERVISOR EVALUATION REPORT (AI key missing/unavailable)]
The candidate participated in the offline naturalization simulation. They answered ${correctCount} of ${totalAnswered} attempted prompts correctly. Their calculated score is ${readiness}%. Suggest full practice under active AI mode when keys are available.`
      };

      return res.json(offlineReport);
    }

    const ai = getAiClient();

    // Compile entire dialog text to hand to analyzer
    const dialogTranscript = messages
      .map((m: any) => `${m.role === "model" ? "OFFICER" : "APPLICANT"}: ${m.content}`)
      .join("\n\n");

    let partialContextInstruction = "";
    if (isPartial) {
      partialContextInstruction = `
CRITICAL: The applicant ended this mock interview prematurely (this is a PARTIAL / INCOMPLETE ASSESSMENT).
- Make sure to explicitly denote this in your review summary.
- Inform them what areas they answered, what areas remain UNTESTED (e.g., if we didn't test N-400 travel, marriage, or moral yes/no questions, call them out as untested), and suggest they do a full-length run next.
- Evaluate the questions they DID complete. Don't punish their scores with 0% for untested parts, but note how they did for the portions they answered.`;
    }

    const analysisPrompt = `You are a former USCIS naturalization officer and expert citizenship interview evaluator.
Your mission is to perform a meticulous evaluation of the completed mock interview transcript below.

Identify:
- Strengths and weaknesses
- Risky answers or response vulnerabilities (dates not specified, overly lengthy details when brief replies are preferred)
- Rehearsed, memorized, or unnatural sounding lines
- Filler words (uh, um, like, I think, maybe) and hesitation indicators

${partialContextInstruction}

Here is the dialog:
\"\"\"
${dialogTranscript}
\"\"\"

Analyze this dialog context and return a structured JSON report regarding their overall performance. Be highly specific, refer directly to examples from their answers, and keep recommendations practical, realistic, and productive.

Return valid JSON with the EXACT structure (do not include markdown syntax around JSON other than the raw JSON output):
{
  "isPartialAssessment": ${isPartial ? "true" : "false"},
  "score": <Overall readiness score out of 100, integer e.g. 82. Reflect realistic naturalization evaluation standards.>,
  "outcome": "<PASS | FAIL | PARTIAL_COMPLETED>",
  "untestedAreas": [
    "<If partial, list untested sections e.g. 'Good moral character questions', 'Travel history details'. If complete, leave empty []>"
  ],
  "breakdown": {
    "civics": <Civics Knowledge percentage, e.g. 90>,
    "fluency": <English Fluency percentage, e.g. 78>,
    "confidence": <Answer Confidence percentage, e.g. 72>,
    "n400": <N-400 Familiarity percentage, e.g. 85>,
    "readiness": <Overall Interview Readiness percentage, e.g. 80>,
    "clarity": <Response Clarity percentage, e.g. 76>
  },
  "whatWentWell": [
    "<Detailed highlight 1 citing a specific positive response from the transcript>",
    "<Detailed highlight 2 of their strong point (e.g. correct civics answers)>",
    "<Detailed highlight 3 of positive communication behaviors recorded>"
  ],
  "areasToImprove": [
    "<Specific recommendation 1 explaining what response was too long or hesitant>",
    "<Specific warning 2 about a vulnerable answer that needs review>",
    "<Specific tip 3 about preferred response length for naturalization officers>"
  ],
  "pronunciationRisk": {
    "level": "<Low | Medium | High>",
    "drillWords": [
      "<specific term 1 the applicant should practice saying clearly, e.g., 'lawful permanent resident'>",
      "<specific term 2 e.g., 'Constitution'>",
      "<specific term 3 e.g., 'selective service'>"
    ]
  },
  "n400Vulnerabilities": [
    "<Identify specific N-400 question risks, e.g., 'Struggled to recall exact exit/entry dates for trips, which often triggers intensive verification.'>",
    "<Cite advice on marital details, children, or good moral questions that felt rehearsed or lacking precision.>"
  ],
  "naturalness": {
    "score": <integer score out of 100>,
    "rehearsedText": "<quote standard rehearsed answer example from transcript or common rehearsed mistake>",
    "preferredText": "<quote and explain a professional, natural spoken formulation they should use instead>"
  },
  "followUpQuestions": [
    "<Potential officer follow-up question 1 they must practice, e.g., 'How many total days did you spend outside the US?'>",
    "<Potential officer follow-up question 2 e.g., 'Do you have tax return transcripts for those working years?'>",
    "<Potential officer follow-up question 3 e.g., 'Can you describe what tasks you perform at your company?'>"
  ],
  "confidenceNotes": "<A 2-3 sentence assessment of filler words, hesitation markers like 'uh' or uncertainty indicators>",
  "officerNotes": "<Professional reviewer session note summary describing their readiness, potential problem areas, and practical advice. Write as if you are preparing the applicant for a real USCIS interview next week. Keep it objective and realistic.>"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      }
    });
    const replyText = response.text || "{}";

    const reportData = JSON.parse(replyText);
    res.json(reportData);
  } catch (error: any) {
    console.error("Evaluation Endpoint Error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// Start the dev server / static server
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server ready.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production build.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Server failed to start:", err);
});
