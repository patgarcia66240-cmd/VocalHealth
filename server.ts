import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

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
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Endpoint to parse vocal transcription using Gemini 3.5 Flash
app.post("/api/parse-measurements", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Le texte à analyser est manquant ou invalide." });
      return;
    }

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

    const structuredData = JSON.parse(parsedText);
    res.json({
      success: true,
      originalText: text,
      data: {
        systolic: structuredData.systolic || null,
        diastolic: structuredData.diastolic || null,
        pulse: structuredData.pulse || null,
        remarks: structuredData.remarks || ""
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur démarré avec succès sur http://localhost:${PORT}`);
  });
}

startServer();
