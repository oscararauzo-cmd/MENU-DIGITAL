import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini client server-side
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY}) : null;

// Intelligent Bar Assistant & Speech Parser Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, eventContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Faltan mensajes en la solicitud' });
    }

    if(!ai)return res.status(503).json({reply:'El asistente no tiene conexión configurada. No se modificó ningún pedido ni insumo.',action:null});
    const latestUserMessage = messages[messages.length - 1].content || messages[messages.length - 1].text;

    const contextStr = eventContext
      ? `\n\n--- ESTADO ACTUAL DEL EVENTO Y BODEGA (${eventContext.name || 'Sin nombre'}) ---
- Estado: ${eventContext.status || 'Activo'}
- Ventas Totales: S/. ${(eventContext.totalRevenue || 0).toFixed(2)} (${eventContext.totalDrinksSold || 0} tragos)
- Cortesías / DJ / Regalos: ${eventContext.totalCourtesyDrinks || 0} tragos
- Mermas Registradas: S/. ${(eventContext.totalWasteCost || 0).toFixed(2)}
- Lista de Cócteles en Carta: ${eventContext.cocktailsList || 'Pisco Sour, Chilcano, Negroni, Muña Mule, Maracuyá Sour, Gin Tonic, Capitán, etc.'}
- Insumos y Stock Remanente:
${eventContext.stockSummary || 'Stock estándar en bodega'}
--------------------------------------------------`
      : '';

    const systemInstruction = `Eres "Chaski", el Asistente Inteligente de Barra de ALTURA - Andean Tapas Bar.
Tu misión es doble:
1. Responder dudas operativas de logística, escenarios "What-if" (¿Qué hubiera pasado si...?), márgenes y stock para el siguiente evento de forma concisa y elegante.
2. DISTRIBUIR y ORGANIZAR información que el bartender o encargado te dicte en lenguaje natural o audio (ej: registrar mermas de botellas rotas, compras de insumos, o comandas/regalos a DJs).

DEBES RESPONDER SIEMPRE EN FORMATO JSON VÁLIDO con la siguiente estructura exacta:
{
  "reply": "Texto de tu respuesta en español, conciso, educado, enfocado en hospitalidad andina de lujo.",
  "action": null | {
    "type": "add_order" | "add_waste" | "update_stock",
    "order": {
      "orderType": "venta" | "dj" | "cortesia",
      "items": [
        { "cocktailName": "Nombre aproximado del cóctel", "quantity": 1 }
      ],
      "notes": "Detalle o nombre del DJ/cliente si aplica"
    },
    "waste": {
      "ingredientName": "Nombre del insumo afectado",
      "quantity": 1,
      "reason": "rotura" | "derrame" | "degustacion" | "otro",
      "notes": "Motivo"
    },
    "stock": {
      "ingredientName": "Nombre del insumo",
      "addedUnits": 6,
      "packageCost": 45.0
    }
  }
}

Reglas:
- Si el usuario dice "Se rompieron 2 botellas de pisco", genera action type "add_waste" con quantity 2, reason "rotura".
- Si dice "Regalamos 2 chilcanos al DJ Marco" o "2 sours para el DJ", genera action type "add_order" con orderType "dj" o "cortesia".
- Si dice "Llegaron 6 botellas de gin a 60 soles", genera action type "update_stock" con addedUnits 6.
- Si solo hace una pregunta de consulta ("¿cuánto stock queda?", "¿qué hubiera pasado si compro x?"), action debe ser null.
- Sé breve y certero en "reply".`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Contexto de Altura Bar:${contextStr}\n\nInstrucción o consulta del usuario:\n${latestUserMessage}`,
          },
        ],
      },
    ];

    let response;
    let attempts = 0;
    while (attempts < 2) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });
        break;
      } catch (err: any) {
        attempts++;
        if (attempts >= 2) throw err;
        await new Promise(r => setTimeout(r, 1200));
      }
    }

    const rawText = (response?.text || '{}').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { reply: rawText, action: null };
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/chat:', error);

    res.status(503).json({reply:'El asistente no está disponible en este momento. No se modificaron pedidos ni insumos.',action:null});
  }
});

// Setup Vite middlewares in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Altura Bar POS & Logistics server running at http://0.0.0.0:${port}`);
  });
}

startServer();
