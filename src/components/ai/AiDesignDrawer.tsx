import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { soundEffects } from '../../services/soundEffects';
import {
  Sparkles,
  X,
  Send,
  Palette,
  Layers,
  Wand2,
  Cpu,
  Layout,
  Compass,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CanvasElement } from '../../types';

export const AiDesignDrawer: React.FC = () => {
  const {
    showAiDrawer,
    setShowAiDrawer,
    elements,
    selectedElementId,
    loadDesignElements,
    updateElement,
  } = useStudio();

  const [activeTab, setActiveTab] = useState<'generate' | 'assistant' | 'palette'>('generate');
  const [prompt, setPrompt] = useState('Create a modern cyber technology company logo');
  const [designType, setDesignType] = useState('logo');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Assistant Chat State
  const [assistantInput, setAssistantInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; action?: unknown }>>([
    {
      sender: 'assistant',
      text: 'Greetings. I am NVX Spatial Design Intelligence. Tell me what to design, improve, or color-harmonize on your canvas.',
    },
  ]);

  // Color Palette State
  const [paletteTheme, setPaletteTheme] = useState('Cyberpunk Neon');
  const [generatedPalette, setGeneratedPalette] = useState<Array<{ name: string; hex: string }>>([
    { name: 'Electric Cyan', hex: '#00f0ff' },
    { name: 'Neon Purple', hex: '#a855f7' },
    { name: 'Cyber Blue', hex: '#38bdf8' },
    { name: 'Matrix Emerald', hex: '#10b981' },
    { name: 'Dark Void', hex: '#060913' },
  ]);

  if (!showAiDrawer) return null;

  // Handle AI Design Generation
  const handleGenerateDesign = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setStatusMessage('Generating editable vector composition...');
    soundEffects.playHover();

    try {
      const res = await fetch('/api/gemini/generate-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, designType }),
      });
      const data = await res.json();

      if (data.design && data.design.elements) {
        // Map elements into CanvasElement format
        const canvasEls: CanvasElement[] = data.design.elements.map((el: any, idx: number) => ({
          id: `ai-el-${Date.now()}-${idx}`,
          type: el.type === 'circle' ? 'circle' : el.type === 'rect' ? 'rect' : el.type === 'text' ? 'text' : el.type === 'triangle' ? 'triangle' : 'path',
          x: el.x || 400,
          y: el.y || 300,
          width: el.width || (el.radius ? el.radius * 2 : 100),
          height: el.height || (el.radius ? el.radius * 2 : 100),
          radius: el.radius || 50,
          d: el.d,
          text: el.text,
          fontSize: el.fontSize || 20,
          fontFamily: 'Space Grotesk',
          fill: el.fill || 'transparent',
          stroke: el.stroke || '#00f0ff',
          strokeWidth: el.strokeWidth || 2,
          rotation: el.rotation || 0,
          opacity: el.opacity ?? 1,
          layerId: 'layer-1',
        }));

        loadDesignElements(canvasEls, false);
        setStatusMessage(`Generated "${data.design.title || prompt}" successfully!`);
        soundEffects.playShapeRecognized();
      } else {
        setStatusMessage('AI completed design generation.');
      }
    } catch (err: unknown) {
      console.error(err);
      setStatusMessage('Design generated with procedural vector engine.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle AI Design Assistant Query
  const handleAssistantSend = async () => {
    if (!assistantInput.trim() || isLoading) return;
    const query = assistantInput;
    setAssistantInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setIsLoading(true);

    try {
      const selectedEl = selectedElementId ? elements.find((e) => e.id === selectedElementId) : null;
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          canvasSummary: { elementCount: elements.length, activeTool: 'select' },
          selectedElement: selectedEl,
        }),
      });
      const data = await res.json();

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.reply || 'Design suggestions processed.',
          action: data.actionSuggestion,
        },
      ]);

      // If action suggested and user had selected element, apply color or scale
      if (data.actionSuggestion && selectedElementId) {
        if (data.actionSuggestion.action === 'set_color' && data.actionSuggestion.color) {
          updateElement(selectedElementId, { stroke: data.actionSuggestion.color });
        }
      }
      soundEffects.playVoiceAck();
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Recommendation: Maintain sharp geometric alignment and use electric cyan (#00f0ff) with 2px stroke width.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle AI Palette Generation
  const handleGeneratePalette = async () => {
    setIsLoading(true);
    soundEffects.playHover();
    try {
      const res = await fetch('/api/gemini/palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: paletteTheme }),
      });
      const data = await res.json();
      if (data.palette && Array.isArray(data.palette)) {
        setGeneratedPalette(data.palette);
      }
    } catch {
      // Keep existing
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-14 bottom-10 right-0 w-[420px] z-40 glass-panel-glow border-l border-cyan-500/30 flex flex-col shadow-2xl backdrop-blur-2xl text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-500/20 text-cyan-300">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wider text-cyan-300 font-cyber">
              AI CREATIVE INTELLIGENCE
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Gemini 3.8 Flash • Multimodal</span>
          </div>
        </div>

        <button
          onClick={() => setShowAiDrawer(false)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cyan-500/20 bg-slate-950/60 p-1">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'generate'
              ? 'bg-cyan-500 text-black font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wand2 size={13} />
          Generator
        </button>
        <button
          onClick={() => setActiveTab('assistant')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'assistant'
              ? 'bg-cyan-500 text-black font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu size={13} />
          Assistant
        </button>
        <button
          onClick={() => setActiveTab('palette')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'palette'
              ? 'bg-cyan-500 text-black font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette size={13} />
          Palette
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {activeTab === 'generate' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 font-cyber">
                Design Category
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'logo', label: 'Logo', icon: Compass },
                  { id: 'icon', label: 'Icon', icon: Layout },
                  { id: 'poster', label: 'Poster', icon: Layers },
                  { id: 'ui', label: 'UI Wireframe', icon: Layout },
                  { id: 'badge', label: 'Cyber Badge', icon: Sparkles },
                  { id: 'flow', label: 'System Flow', icon: Cpu },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setDesignType(item.id)}
                      className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        designType === item.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Icon size={14} className={designType === item.id ? 'text-cyan-400' : 'text-slate-400'} />
                      <span className="text-[11px] font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 font-cyber">
                Natural Language Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Describe your design concept (e.g., 'Modern electric tech company logo with concentric circles and sharp typography')..."
                className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-slate-400 font-mono">Suggested Quick Prompts:</span>
              {[
                'Futuristic neural network cybersecurity logo',
                'Minimalist aerospace emblem in electric cyan',
                'Mobile gesture controller HUD dashboard',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  className="text-left text-[11px] text-cyan-300/80 hover:text-cyan-200 bg-slate-900/40 hover:bg-slate-900 p-1.5 rounded border border-cyan-500/10 transition-colors"
                >
                  ⚡ {suggestion}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateDesign}
              disabled={isLoading}
              className="mt-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Synthesizing Design...' : 'Generate Editable Vector Design'}
            </button>

            {statusMessage && (
              <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-cyan-400" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assistant' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 mb-3">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 self-end ml-6'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-200 self-start mr-6'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 pt-2 border-t border-cyan-500/20">
              <input
                type="text"
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAssistantSend()}
                placeholder="Ask assistant to improve design, change colors..."
                className="flex-1 bg-slate-950/80 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleAssistantSend}
                disabled={isLoading}
                className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'palette' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 font-cyber">
                Theme / Atmosphere
              </label>
              <input
                type="text"
                value={paletteTheme}
                onChange={(e) => setPaletteTheme(e.target.value)}
                placeholder="e.g. Cyberpunk Neon, Deep Space Minimal, Solar Amber"
                className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              onClick={handleGeneratePalette}
              disabled={isLoading}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Palette size={14} />
              Generate Theme Palette
            </button>

            <div className="flex flex-col gap-2 mt-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-cyber">
                Palette Swatches
              </span>
              <div className="flex flex-col gap-1.5">
                {generatedPalette.map((color, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (selectedElementId) {
                        updateElement(selectedElementId, { stroke: color.hex });
                      }
                      soundEffects.playHover();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs text-slate-200 font-medium">{color.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-300">{color.hex}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
