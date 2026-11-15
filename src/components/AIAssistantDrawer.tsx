import { assistantActionPlan } from '../utils/assistantActions';
import React, { useState, useRef, useEffect } from 'react';
import { BarEvent, Cocktail, Ingredient, Order, WasteRecord } from '../types/bar';
import { calculateEventMetrics } from '../utils/calculations';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  X,
  BotMessageSquare,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeEvent: BarEvent;
  cocktails: Cocktail[];
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  onAddOrder: (order: Order) => void;
  onAddWaste: (waste: WasteRecord) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  actionSummary?: string;
  pendingAction?: any;
  timestamp: number;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  activeEvent,
  cocktails,
  ingredients,
  setIngredients,
  onAddOrder,
  onAddWaste,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Buenas noches. Soy **Chaski**, tu asistente de barra en Altura.

Puedes hablarme o escribir cualquier dato desestructurado:
- *"Se rompieron 2 botellas de pisco en la barra"* (registraré la merma)
- *"Llegaron 6 botellas de gin a 60 soles"* (ingresaré el stock a bodega)
- *"Regálale 2 chilcanos al DJ Marco"* (anotaré la cortesía)
- O pregúntame dudas de stock y escenarios What-If.`,
      timestamp: Date.now(),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef=useRef<any>(null);
  const applied=useRef(new Set<string>());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const metrics = calculateEventMetrics(activeEvent, cocktails, ingredients);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  // Speech Recognition setup (Web Speech API)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessages(prev => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'model',
          content: 'Tu navegador actual no admite dictado por micrófono directo, pero puedes escribirme aquí abajo sin problema.',
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current=recognition;
      recognition.lang = 'es-PE';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputPrompt(transcript);
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  useEffect(()=>{if(!isOpen)recognitionRef.current?.abort();return()=>recognitionRef.current?.abort();},[isOpen]);
  // Dispatch actions to state
  const executeServerAction = (action:any):string => {
    if(activeEvent.status!=='active')throw new Error('Abre una jornada o evento activo antes de aplicar cambios.');
    const plan=assistantActionPlan(action,cocktails,ingredients);
    if(plan.type==='order')onAddOrder(plan.value);
    else if(plan.type==='waste')onAddWaste(plan.value);
    else setIngredients(previous=>previous.map(ingredient=>ingredient.id===plan.value.ingredientId?{...ingredient,currentStockUnits:ingredient.currentStockUnits+plan.value.units,packageCost:plan.value.price}:ingredient));
    return plan.summary;
  };

  // Send message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    const stockSummary = metrics.ingredientStats
      .map(
        i =>
          `- ${i.name}: ${i.residualStockPackages} botellas remanentes (inicial: ${i.initialStock}, consumido: ${i.consumedPackages}, merma: ${i.wastePackages})`
      )
      .join('\n');

    const cocktailsList = cocktails.map(c => `${c.name} (S/. ${c.price})`).join(', ');

    const eventContext = {
      name: activeEvent.name,
      status: activeEvent.status,
      totalRevenue: metrics.totalRevenue,
      totalDrinksSold: metrics.totalDrinksSold,
      totalCourtesyDrinks: metrics.totalCourtesyDrinks,
      totalWasteCost: metrics.totalWasteCost,
      cocktailsList,
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

      if (!response.ok) {const details=await response.json().catch(()=>({}));throw new Error(details.reply||'No se pudo conectar con el asistente.');}

      const data = await response.json();
      const proposal=data.action&&data.action.type!=='none'?assistantActionPlan(data.action,cocktails,ingredients):null;

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: proposal?`Propuesta pendiente: ${proposal.summary}. Revisa y aplica para guardarla.`:data.reply||'No se recibieron datos.',
        pendingAction:proposal?data.action:undefined,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setInputPrompt(textToSend);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: err.message||'No pude procesar la instrucción. No se modificaron datos.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full sm:max-w-lg h-[85vh] sm:h-[620px] bg-white border-2 border-orange-200 sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <BotMessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans text-sm font-bold tracking-wide">
                Chaski · Asistente IA de Barra
              </h3>
              <p className="text-[11px] text-orange-100">
                Dicta por voz o escribe pedidos, mermas y compras
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Voice Prompt Suggestions */}
        <div className="px-4 py-2 bg-orange-50/80 border-b border-orange-100 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px]">
          <span className="text-orange-900 font-bold shrink-0 font-sans">Prueba decir:</span>
          {[
            'Se rompió 1 botella de pisco',
            'Regálale 2 sours al DJ',
            'Llegaron 6 botellas de gin',
            '¿Cuánto ginger beer nos queda?',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1 rounded-full bg-white hover:bg-orange-100 border border-orange-200 text-orange-800 font-bold whitespace-nowrap active:scale-95 transition cursor-pointer shadow-sm"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#faf8f5]">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-orange-600 text-white rounded-br-none shadow-orange-500/20'
                    : 'bg-white text-stone-800 rounded-bl-none border border-stone-200 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap font-medium">{msg.content}</div>

                {msg.pendingAction&&<button onClick={()=>{if(applied.current.has(msg.id))return;try{const summary=executeServerAction(msg.pendingAction);applied.current.add(msg.id);setMessages(previous=>previous.map(message=>message.id===msg.id?{...message,pendingAction:undefined,actionSummary:summary}:message));}catch(error){setMessages(previous=>previous.map(message=>message.id===msg.id?{...message,content:error instanceof Error?error.message:'No se pudo aplicar.'}:message));}}} className="mt-3 min-h-11 px-3 rounded-xl bg-orange-600 text-white font-bold">Aplicar propuesta</button>}
                {/* If AI executed an action inside the app */}
                {msg.actionSummary && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-300 flex items-center gap-1.5 text-emerald-800 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{msg.actionSummary}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-orange-200 text-xs text-orange-800 font-bold max-w-xs shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-ping"></span>
              <span>Chaski está organizando los datos en la barra...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice & Text Input Bar */}
        <div className="p-3.5 bg-white border-t border-orange-100">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage(inputPrompt);
            }}
            className="flex items-center gap-2"
          >
            {/* Big Mic Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 shadow-md ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                  : 'bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300'
              }`}
              title={isListening ? 'Detener dictado' : 'Hablar por micrófono'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              placeholder={isListening ? 'Escuchando tu voz ahora...' : 'Escribe o dicta cualquier orden, merma o compra...'}
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-stone-50 border-2 border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 font-medium"
            />

            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="w-11 h-11 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:opacity-30 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 shadow-lg shadow-orange-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
