import React, { useState, useRef, useEffect } from 'react';
import { BarEvent, Cocktail, Ingredient } from '../types/bar';
import { calculateEventMetrics } from '../utils/calculations';
import {
  BotMessageSquare,
  Send,
  Sparkles,
  HelpCircle,
  TrendingUp,
  ShoppingBag,
  RotateCcw,
  Boxes,
  Calculator,
  User,
} from 'lucide-react';

interface LogisticsChatbotProps {
  activeEvent: BarEvent;
  cocktails: Cocktail[];
  ingredients: Ingredient[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export const LogisticsChatbot: React.FC<LogisticsChatbotProps> = ({
  activeEvent,
  cocktails,
  ingredients,
}) => {
  const metrics = calculateEventMetrics(activeEvent, cocktails, ingredients);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `¡Hola, equipo de Altura! Soy **Chaski Bar Logix**, tu asistente de logística, costos y escenarios para este evento (**${activeEvent.name}**).

Puedes preguntarme cualquier duda operativa o simular escenarios como:
* *"¿Qué hubiera pasado si compraba el Pisco a S/. 32 en vez de S/. 38?"*
* *"¿Cuánto stock de botellas me queda para el próximo evento y qué debo comprar?"*
* *"¿Cuál fue el cóctel con mayor margen de ganancia esta noche?"*
* *"¿Cuánto nos costaron las cortesías y tragos de DJs?"*

¿En qué puedo ayudarte ahora?`,
      timestamp: Date.now(),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Suggested logistical chips
  const suggestedQuestions = [
    '¿Qué hubiera pasado si compraba el Pisco a S/. 32 en vez de S/. 38?',
    '¿Cuánto stock me queda para el próximo evento y qué debo reponer?',
    '¿Cuál fue el trago más rentable y con mayor margen?',
    '¿Cuánto dinero en costo se fue en cortesías y DJs?',
    '¿Cuántos Chilcanos más puedo servir con el Ginger Beer restante?',
    '¿Qué pasa si aumento S/. 3 al precio de venta del Pisco Sour?',
  ];

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: userText.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    // Prepare real-time context
    const stockSummary = metrics.ingredientStats
      .map(
        i =>
          `- ${i.name}: Inicial ${i.initialStock} | Consumo ${i.consumedPackages} env. | Merma ${i.wastePackages} | Remanente ${i.residualStockPackages} (Estado: ${i.needsRestock ? 'NECESITA REPOSICION +' + i.restockSuggested : 'OK'})`
      )
      .join('\n');

    const topDrinks = metrics.drinkStats
      .filter(d => d.soldQty > 0 || d.courtesyQty > 0)
      .map(d => ({
        nombre: d.name,
        vendidos: d.soldQty,
        cortesias_dj: d.courtesyQty,
        precio_venta: d.unitPrice,
        costo_unit: d.unitCost,
        margen_pct: d.unitMarginPercent.toFixed(1) + '%',
        ingresos: d.totalRevenue,
        ganancia: d.totalGrossProfit,
      }));

    const eventContext = {
      name: activeEvent.name,
      status: activeEvent.status,
      totalRevenue: metrics.totalRevenue,
      totalDrinksSold: metrics.totalDrinksSold,
      totalCourtesyDrinks: metrics.totalCourtesyDrinks,
      totalCost: metrics.totalCostSold + metrics.totalCostCourtesy,
      grossProfit: metrics.grossProfit,
      profitMargin: metrics.grossProfitMarginPercent / 100,
      wasteCount: metrics.wastes.length,
      topDrinks,
      stockSummary,
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
          eventContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en servidor: ${response.status}`);
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: data.reply || 'Sin respuesta del asistente.',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Lo siento, ocurrió un error al consultar con Gemini: ${err.message}. Por favor verifica la conexión e intenta de nuevo.`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        content: `Conversación reiniciada. Estoy listo para ayudarte con más consultas logísticas sobre **${activeEvent.name}**.`,
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0e0c0a] text-[#f4efe6] overflow-hidden">
      {/* Chat header */}
      <div className="px-4 py-3 bg-[#141210] border-b border-[#241f1a] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#993b22] to-amber-700 flex items-center justify-center text-white shadow-md">
            <BotMessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#f5ede2]">
                Asistente Logístico IA & What-If
              </h2>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-[11px] text-[#9c8e80]">
              Consultas en vivo sobre costos, stock remanente, mermas y simulaciones de compra
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="text-xs text-[#a89d91] hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
          title="Reiniciar conversación"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 bg-[#171411] border-b border-[#241f1a] overflow-x-auto scrollbar-none flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-[#8c7e71] uppercase font-bold shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Sugerencias:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-[#201b17] hover:bg-[#2e261f] border border-[#332b24] text-[11px] text-[#d6c7b7] hover:text-white whitespace-nowrap active:scale-95 transition cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'model' && (
              <div className="w-7 h-7 rounded-lg bg-[#993b22] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                <BotMessageSquare className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-[#832d18] to-[#993b22] text-white rounded-br-none border border-[#d96548]/40'
                  : 'bg-[#171411] text-[#f4efe6] rounded-bl-none border border-[#2a231d]'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
              <span className="text-[9px] opacity-50 block mt-1.5 text-right font-mono">
                {new Date(msg.timestamp).toLocaleTimeString('es-PE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-[#2b241e] text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#993b22] text-white flex items-center justify-center shrink-0 shadow-md">
              <BotMessageSquare className="w-3.5 h-3.5" />
            </div>
            <div className="bg-[#171411] border border-[#2a231d] rounded-2xl rounded-bl-none p-3 text-xs text-[#a89d91] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>Chaski Bar Logix está calculando costos y escenarios...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 bg-[#141210] border-t border-[#241f1a]">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage(inputPrompt);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Pregunta sobre logística, stock para el siguiente evento o '¿Qué hubiera pasado si...?'"
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 bg-[#1a1613] border border-[#332b24] rounded-xl text-xs sm:text-sm text-white placeholder-[#786c5f] focus:outline-none focus:border-[#993b22]"
          />

          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#993b22] hover:bg-[#b8492d] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preguntar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
