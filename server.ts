import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// Initialize Gemini client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Intelligent Bar Assistant & Speech Parser Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, eventContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Faltan mensajes en la solicitud' });
    }

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

    // Smart bar heuristic fallback in case of transient model overload
    const lower = (req.body?.messages?.slice(-1)[0]?.content || '').toLowerCase();
    let fallbackAction = null;
    let fallbackReply = 'He procesado tu mensaje en el sistema.';

    if (lower.includes('rompi') || lower.includes('derrame') || lower.includes('merma')) {
      const matchNum = lower.match(/\d+/);
      const qty = matchNum ? parseInt(matchNum[0], 10) : 1;
      const ingName = lower.includes('pisco') ? 'Pisco Quebranta' : lower.includes('gin') ? 'Gin Amazónico' : 'Insumo de barra';
      fallbackAction = {
        type: 'add_waste',
        waste: { ingredientName: ingName, quantity: qty, reason: 'rotura', notes: 'Registrado con asistente de barra' }
      };
      fallbackReply = `Registrada la merma de ${qty} unidad(es) de ${ingName}. Descontado de bodega.`;
    } else if (lower.includes('dj') || lower.includes('cortesia') || lower.includes('regal')) {
      const matchNum = lower.match(/\d+/);
      const qty = matchNum ? parseInt(matchNum[0], 10) : 1;
      const drinkName = lower.includes('chilcano') ? 'Chilcano de Pisco' : 'Pisco Sour Clásico';
      fallbackAction = {
        type: 'add_order',
        order: { orderType: 'dj', items: [{ cocktailName: drinkName, quantity: qty }], notes: 'Cortesía DJ / Invitado' }
      };
      fallbackReply = `Anotados ${qty}x ${drinkName} de cortesía para el DJ/invitado.`;
    } else if (lower.includes('llegaron') || lower.includes('compr') || lower.includes('stock')) {
      const matchNum = lower.match(/\d+/);
      const qty = matchNum ? parseInt(matchNum[0], 10) : 6;
      const ingName = lower.includes('gin') ? 'Gin Amazónico' : lower.includes('pisco') ? 'Pisco Quebranta' : 'Insumo';
      fallbackAction = {
        type: 'update_stock',
        stock: { ingredientName: ingName, addedUnits: qty, packageCost: 45.0 }
      };
      fallbackReply = `Ingresadas +${qty} unidades de ${ingName} al inventario de bodega.`;
    } else {
      fallbackReply = 'Actualmente los servidores de IA están ocupados temporalmente, pero tus pedidos y comandas se están registrando y cuadrando normalmente en la barra.';
    }

    res.json({
      reply: fallbackReply,
      action: fallbackAction,
    });
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
