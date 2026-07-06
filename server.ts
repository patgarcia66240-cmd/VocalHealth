import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { getTursoClient, isTursoConfigured } from "./server/db/turso";
import { getStorageMode } from "./server/config/storageMode";
import tursoRoutes from "./server/routes/tursoRoutes";

// Charger explicitement .env.local
dotenv.config({ path: '.env.local' });

const app = express();
app.use(express.json({ limit: "15mb" }));

const PORT = 3000;

// Lazy initialization of Gemini client to prevent crashes on startup
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("La clé API GEMINI_API_KEY n'est pas configurée dans les secrets de l'application.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Endpoint status/health
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/api/db/status", async (_req, res) => {
  const storageMode = getStorageMode();

  if (storageMode === "local") {
    res.json({ mode: storageMode, configured: false, status: "local" });
    return;
  }

  if (!isTursoConfigured()) {
    res.json({ mode: storageMode, configured: false, status: "not_configured" });
    return;
  }

  try {
    const db = getTursoClient();
    await db.execute("SELECT 1");
    res.json({ mode: storageMode, configured: true, status: "ok" });
  } catch (error: any) {
    res.status(500).json({
      configured: true,
      mode: storageMode,
      status: "error",
      error: error.message || "Turso connection failed",
    });
  }
});

app.use("/api/cloud", tursoRoutes);

async function parseWithOpenAI(text: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Tu es un assistant médical de confiance. Analyse la transcription vocale en français d'un patient décrivant ses mesures de tension artérielle, de pouls et éventuellement de remarques (symptômes, état d'esprit, contexte). Tu dois retourner UNIQUEMENT un objet JSON valide contenant précisément ces clés :
- "systolic": un entier en mmHg (ex: "12 8" -> 120, "13.5" -> 135) ou null
- "diastolic": un entier en mmHg (ex: "12 8" -> 80, "7.8" -> 78) ou null
- "pulse": un entier en battements par minute (bpm) ou null
- "remarks": une chaîne de caractères (contexte, symptômes, fatigue...) ou une chaîne vide.

Règles de normalisation de la tension:
1. En français, la tension est souvent dictée sous la forme "12 8", "12 sur 8", "12 virgule 8", ou "128". Convertis toujours au format mmHg (ex: 12 -> 120, 8 -> 80).
2. Si une seule valeur est présente, renvoie-la directement (ex: systolique: 130).
3. Le pouls est généralement dit comme "pouls à 72", "72 battements" -> pouls: 72.
4. Tout autre commentaire va dans "remarks".`
        },
        {
          role: "user",
          content: text
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur API OpenAI: ${response.statusText} (${response.status}) - ${errorText}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Pas de réponse reçue d'OpenAI.");
  }
  return JSON.parse(content);
}

async function parseWithMistral(text: string, apiKey: string) {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Tu es un assistant médical de confiance. Analyse la transcription vocale en français d'un patient décrivant ses mesures de tension artérielle, de pouls et éventuellement de remarques (symptômes, état d'esprit, contexte). Tu dois retourner UNIQUEMENT un objet JSON valide contenant précisément ces clés :
- "systolic": un entier en mmHg (ex: "12 8" -> 120, "13.5" -> 135) ou null
- "diastolic": un entier en mmHg (ex: "12 8" -> 80, "7.8" -> 78) ou null
- "pulse": un entier en battements par minute (bpm) ou null
- "remarks": une chaîne de caractères (contexte, symptômes, fatigue...) ou une chaîne vide.

Règles de normalisation de la tension:
1. En français, la tension est souvent dictée sous la forme "12 8", "12 sur 8", "12 virgule 8", ou "128". Convertis toujours au format mmHg (ex: 12 -> 120, 8 -> 80).
2. Si une seule valeur est présente, renvoie-la directement (ex: systolique: 130).
3. Le pouls est généralement dit comme "pouls à 72", "72 battements" -> pouls: 72.
4. Tout autre commentaire va dans "remarks".`
        },
        {
          role: "user",
          content: text
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur API Mistral: ${response.statusText} (${response.status}) - ${errorText}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Pas de réponse reçue de Mistral.");
  }
  return JSON.parse(content);
}

async function parseWithQwen(text: string, apiKey: string) {
  const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "qwen-plus",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Tu es un assistant médical de confiance. Analyse la transcription vocale en français d'un patient décrivant ses mesures de tension artérielle, de pouls et éventuellement de remarques (symptômes, état d'esprit, contexte). Tu dois retourner UNIQUEMENT un objet JSON valide contenant précisément ces clés :
- "systolic": un entier en mmHg (ex: "12 8" -> 120, "13.5" -> 135) ou null
- "diastolic": un entier en mmHg (ex: "12 8" -> 80, "7.8" -> 78) ou null
- "pulse": un entier en battements par minute (bpm) ou null
- "remarks": une chaîne de caractères (contexte, symptômes, fatigue...) ou une chaîne vide.

Règles de normalisation de la tension:
1. En français, la tension est souvent dictée sous la forme "12 8", "12 sur 8", "12 virgule 8", ou "128". Convertis toujours au format mmHg (ex: 12 -> 120, 8 -> 80).
2. Si une seule valeur est présente, renvoie-la directement (ex: systolique: 130).
3. Le pouls est généralement dit comme "pouls à 72", "72 battements" -> pouls: 72.
4. Tout autre commentaire va dans "remarks".`
        },
        {
          role: "user",
          content: text
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur API Qwen: ${response.statusText} (${response.status}) - ${errorText}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Pas de réponse reçue de Qwen.");
  }
  return JSON.parse(content);
}

const imageAnalysisPrompt = `Lis cette image comme un assistant IA de lecture visuelle médicale. Extrais les mesures visibles de tension artérielle, pouls et SpO2.

Retourne uniquement un JSON valide avec ces clés :
- "extractedText": transcription courte du texte utile visible sur l'image
- "records": tableau de mesures détectées

Chaque entrée de "records" doit contenir :
- "timestamp": date ISO si une date/heure est visible, sinon null
- "systolic": entier mmHg ou null
- "diastolic": entier mmHg ou null
- "pulse": entier bpm ou null
- "spo2": entier pourcentage ou null
- "notes": court commentaire utile, sinon chaîne vide

Règles :
1. N'utilise pas de devinette médicale. Si une valeur n'est pas lisible, mets null.
2. Reconnais les formats 120/80, 12/8, 12 8, SYS/DIA, tension, pouls, BPM, SpO2.
3. Normalise 12/8 en 120/80, 13/8 en 130/80, mais garde 124/82 tel quel.
4. Ignore les nombres qui ne sont manifestement pas des constantes de santé.
5. Si plusieurs lignes de mesures existent, retourne plusieurs records.`;

async function parseImageWithOpenAI(imageData: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: imageAnalysisPrompt },
            { type: "image_url", image_url: { url: imageData } }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur API OpenAI vision: ${response.statusText} (${response.status}) - ${errorText}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Pas de réponse image reçue d'OpenAI.");
  }
  return JSON.parse(content);
}

async function parseImageWithMistral(imageData: string, apiKey: string) {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "pixtral-large-latest",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: imageAnalysisPrompt },
            { type: "image_url", image_url: imageData }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur API Mistral vision: ${response.statusText} (${response.status}) - ${errorText}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Pas de réponse image reçue de Mistral.");
  }
  return JSON.parse(content);
}

// Endpoint to parse vocal transcription using dynamic AI engine
app.post("/api/parse-measurements", async (req, res) => {
  try {
    const { text, provider = "gemini" } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Le texte à analyser est manquant ou invalide." });
      return;
    }

    let structuredData: any = null;

    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        res.status(400).json({
          success: false,
          error: "La clé API OPENAI_API_KEY n'est pas configurée dans le fichier .env.local de l'application."
        });
        return;
      }
      structuredData = await parseWithOpenAI(text, apiKey);
    } else if (provider === "mistral") {
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        res.status(400).json({
          success: false,
          error: "La clé API MISTRAL_API_KEY n'est pas configurée dans le fichier .env.local de l'application."
        });
        return;
      }
      structuredData = await parseWithMistral(text, apiKey);
    } else if (provider === "qwen") {
      const apiKey = process.env.QWEN_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        res.status(400).json({
          success: false,
          error: "La clé API QWEN_API_KEY n'est pas configurée dans le fichier .env.local de l'application."
        });
        return;
      }
      structuredData = await parseWithQwen(text, apiKey);
    } else {
      // Default to Gemini
      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyse la transcription vocale suivante en français d'un patient décrivant ses mesures de tension artérielle, de pouls et éventuellement de remarques (symptômes, état d'esprit, contexte). Extrais les valeurs de manière structurée.
        
Transcription vocale: "${text}"

Règles de normalisation de la tension:
1. En français, la tension est souvent dictée sous la forme "12 8", "12 sur 8", "12 virgule 8", ou "128".
2. Convertis et normalise toujours ces valeurs au format standard mmHg (millimètres de mercure). Par exemple :
   - "12 8" ou "12 sur 8" -> systolique: 120, diastolique: 80
   - "13,5 7,8" -> systolique: 135, diastolique: 78
   - "14 9" -> systolique: 140, diastolique: 90
   - "124 sur 82" ou "124 82" -> systolique: 124, diastolique: 82
   - Si une seule valeur est présente (ex: "ma systolique est à 130"), renvoie la valeur telle quelle (systolique: 130).
3. Le pouls est généralement dicté comme "pouls à 72", "72 pulsations", "72 battements" -> pouls: 72.
4. Extrais toutes les autres informations d'état d'esprit, de symptômes ou d'heure en tant que remarques (ex: "un peu fatigué", "le matin à jeun", "après l'effort").`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              systolic: {
                type: Type.INTEGER,
                description: "Pression systolique en mmHg. Normalisé si dit en format abrégé (ex: 12 -> 120, 13.5 -> 135). Peut être null si non trouvé."
              },
              diastolic: {
                type: Type.INTEGER,
                description: "Pression diastolique en mmHg. Normalisé si dit en format abrégé (ex: 8 -> 80, 7.5 -> 75). Peut être null si non trouvé."
              },
              pulse: {
                type: Type.INTEGER,
                description: "Fréquence cardiaque en pulsations par minute (pouls). Peut être null si non trouvé."
              },
              remarks: {
                type: Type.STRING,
                description: "Remarques, symptômes, notes de contexte ou commentaires additionnels de l'utilisateur. Peut être null si absent."
              }
            }
          }
        }
      });

      const parsedText = response.text;
      if (!parsedText) {
        throw new Error("Réponse vide reçue de l'IA.");
      }

      structuredData = JSON.parse(parsedText);
    }

    res.json({
      success: true,
      originalText: text,
      data: {
        systolic: structuredData.systolic || structuredData.systolique || null,
        diastolic: structuredData.diastolic || structuredData.diastolique || null,
        pulse: structuredData.pulse || structuredData.pouls || null,
        remarks: structuredData.remarks || structuredData.commentaire || ""
      }
    });

  } catch (error: any) {
    console.error("Erreur lors de l'analyse par l'IA :", error);
    res.status(500).json({
      success: false,
      error: error.message || "Une erreur interne est survenue lors de l'analyse vocale."
    });
  }
});

function parseDataUrlImage(imageData: string) {
  const match = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Image invalide. Format base64 attendu.");
  }

  return {
    mimeType: match[1],
    data: match[2]
  };
}

// Endpoint to parse blood pressure records directly from an image using AI vision
app.post("/api/parse-measurements-image", async (req, res) => {
  try {
    const { imageData, provider = "gemini", analysisTimestamp } = req.body;
    if (!imageData || typeof imageData !== "string") {
      res.status(400).json({ error: "L'image à analyser est manquante ou invalide." });
      return;
    }

    const fallbackTimestamp =
      typeof analysisTimestamp === "string" && !Number.isNaN(Date.parse(analysisTimestamp))
        ? new Date(analysisTimestamp).toISOString()
        : new Date().toISOString();

    let structuredData: any = null;

    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        res.status(400).json({
          success: false,
          error: "La clé API OPENAI_API_KEY n'est pas configurée dans le fichier .env.local de l'application."
        });
        return;
      }
      structuredData = await parseImageWithOpenAI(imageData, apiKey);
    } else if (provider === "mistral") {
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        res.status(400).json({
          success: false,
          error: "La clé API MISTRAL_API_KEY n'est pas configurée dans le fichier .env.local de l'application."
        });
        return;
      }
      structuredData = await parseImageWithMistral(imageData, apiKey);
    } else {
      const image = parseDataUrlImage(imageData);
      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: image.mimeType,
              data: image.data
            }
          },
          {
            text: imageAnalysisPrompt
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractedText: {
                type: Type.STRING,
                description: "Transcription courte du texte utile visible sur l'image."
              },
              records: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timestamp: {
                      type: Type.STRING,
                      description: "Date ISO si visible, sinon null."
                    },
                    systolic: {
                      type: Type.INTEGER,
                      description: "Pression systolique en mmHg, ou null."
                    },
                    diastolic: {
                      type: Type.INTEGER,
                      description: "Pression diastolique en mmHg, ou null."
                    },
                    pulse: {
                      type: Type.INTEGER,
                      description: "Pouls en bpm, ou null."
                    },
                    spo2: {
                      type: Type.INTEGER,
                      description: "Saturation SpO2 en pourcentage, ou null."
                    },
                    notes: {
                      type: Type.STRING,
                      description: "Commentaire utile, ou chaîne vide."
                    }
                  }
                }
              }
            }
          }
        }
      });

      const parsedText = response.text;
      if (!parsedText) {
        throw new Error("Réponse vide reçue de l'IA vision.");
      }
      structuredData = JSON.parse(parsedText);
    }

    const records = Array.isArray(structuredData.records) ? structuredData.records : [];

    res.json({
      success: true,
      extractedText: structuredData.extractedText || "",
      records: records
        .filter((record: any) => record && Number.isFinite(record.systolic) && Number.isFinite(record.diastolic))
        .map((record: any) => ({
          timestamp:
            typeof record.timestamp === "string" && !Number.isNaN(Date.parse(record.timestamp))
              ? new Date(record.timestamp).toISOString()
              : fallbackTimestamp,
          systolic: record.systolic ?? null,
          diastolic: record.diastolic ?? null,
          pulse: record.pulse ?? null,
          spo2: record.spo2 ?? null,
          notes: record.notes || "Importé par analyse IA"
        }))
    });
  } catch (error: any) {
    console.error("Erreur lors de l'analyse d'image par l'IA :", error);
    res.status(500).json({
      success: false,
      error: error.message || "Une erreur interne est survenue lors de l'analyse de l'image."
    });
  }
});

async function startServer() {
  // Vite dev middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur démarré avec succès sur http://localhost:${PORT}`);
  });
}

startServer();
