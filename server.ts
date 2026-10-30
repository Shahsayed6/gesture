import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// AI Design Generator endpoint
app.post('/api/gemini/generate-design', async (req: Request, res: Response) => {
  try {
    const { prompt, designType = 'logo', style = 'modern' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      // Fallback response if no API key is attached
      return res.json({
        fallback: true,
        design: generateFallbackDesign(prompt, designType),
        message: 'No GEMINI_API_KEY set in Secrets. High-fidelity procedural design generated.',
      });
    }

    const systemPrompt = `You are an elite vector graphic designer and design system architect.
Generate a structured, clean JSON definition of an editable vector design based on the user's prompt.
Supported element types:
- 'rect': x, y, width, height, fill, stroke, strokeWidth, rx (border radius)
- 'circle': x, y, radius, fill, stroke, strokeWidth
- 'path': d (SVG path data like 'M... L... Z'), fill, stroke, strokeWidth
- 'text': text, x, y, fontSize, fill, fontFamily ('Space Grotesk' or 'Plus Jakarta Sans'), fontWeight
- 'star': x, y, radius, innerRadius, points (e.g. 5), fill, stroke, strokeWidth

All coordinates should fit naturally within a 800x600 viewBox canvas centered at x: 400, y: 300.
Use modern aesthetic palettes: electric cyan (#00f0ff), deep navy (#0a1026), neon violet (#a855f7), bright amber (#f59e0b), crisp white (#ffffff), slate (#64748b).
Ensure elements are grouped logically. Return 4 to 12 elements.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Design request: "${prompt}". Type: ${designType}. Style: ${style}. Return the structured vector design JSON.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            canvasWidth: { type: Type.NUMBER },
            canvasHeight: { type: Type.NUMBER },
            backgroundColor: { type: Type.STRING },
            description: { type: Type.STRING },
            palette: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            elements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER },
                  radius: { type: Type.NUMBER },
                  d: { type: Type.STRING },
                  text: { type: Type.STRING },
                  fontSize: { type: Type.NUMBER },
                  fill: { type: Type.STRING },
                  stroke: { type: Type.STRING },
                  strokeWidth: { type: Type.NUMBER },
                  rotation: { type: Type.NUMBER },
                  opacity: { type: Type.NUMBER },
                },
                required: ['type', 'x', 'y'],
              },
            },
          },
          required: ['title', 'elements'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, design: parsed });
  } catch (err: unknown) {
    console.error('Error in /api/gemini/generate-design:', err);
    // Return structured procedural fallback on any Gemini error so user is never blocked
    const fallback = generateFallbackDesign(req.body.prompt || 'Cyber Concept', req.body.designType || 'logo');
    return res.json({
      success: true,
      fallback: true,
      design: fallback,
      errorNotice: err instanceof Error ? err.message : 'AI generation error',
    });
  }
});

// AI Design Assistant endpoint (Chat & recommendations)
app.post('/api/gemini/assistant', async (req: Request, res: Response) => {
  try {
    const { message, canvasSummary, selectedElement } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        reply: `NVX Design Assistant: I recommend aligning your elements along the golden ratio grid and applying an electric cyan accent (#00f0ff) with a subtle dark backdrop for optimal contrast.`,
        actionSuggestion: {
          action: 'adjust_color',
          targetFill: '#00f0ff',
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `User design assistant query: "${message}".
Current canvas state: ${JSON.stringify(canvasSummary || {})}
Selected element: ${JSON.stringify(selectedElement || null)}

Provide a concise, expert creative response and an optional automated design action (e.g., change color, scale, align, or add futuristic accent).`,
      config: {
        systemInstruction: `You are NVX Studio's resident Senior Creative Director & Spatial UI Expert.
Provide ultra-concise, actionable design critiques and recommendations.
Tone: visionary, precise, futuristic. Return JSON.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            actionSuggestion: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING, description: 'e.g. set_color, scale, align_center, add_glow' },
                color: { type: Type.STRING },
                scaleFactor: { type: Type.NUMBER },
                strokeWidth: { type: Type.NUMBER },
                explanation: { type: Type.STRING },
              },
            },
            paletteSuggestion: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['reply'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: unknown) {
    console.error('Error in /api/gemini/assistant:', err);
    return res.json({
      reply: `Design Assistant: Consider using electric cyan (#00f0ff) with a 2px stroke and 0.85 opacity for optimal visibility in air-drawing mode.`,
      actionSuggestion: {
        action: 'set_color',
        color: '#00f0ff',
      },
    });
  }
});

// AI Color Palette endpoint
app.post('/api/gemini/palette', async (req: Request, res: Response) => {
  try {
    const { theme = 'cyberpunk technology' } = req.body;
    const ai = getGenAI();
    if (!ai) {
      return res.json({
        palette: [
          { name: 'Neon Cyan', hex: '#00f0ff' },
          { name: 'Electric Violet', hex: '#8b5cf6' },
          { name: 'Matrix Green', hex: '#10b981' },
          { name: 'Solar Amber', hex: '#f59e0b' },
          { name: 'Obsidian Void', hex: '#090d16' },
          { name: 'Starlight Silver', hex: '#f8fafc' },
        ],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate a 6-color professional design palette for theme: "${theme}". Return JSON array of objects with 'name' and 'hex'.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            palette: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  hex: { type: Type.STRING },
                },
                required: ['name', 'hex'],
              },
            },
          },
          required: ['palette'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (_err) {
    return res.json({
      palette: [
        { name: 'Electric Cyan', hex: '#00f0ff' },
        { name: 'Cyber Indigo', hex: '#6366f1' },
        { name: 'Hot Magenta', hex: '#ec4899' },
        { name: 'Aurora Emerald', hex: '#10b981' },
        { name: 'Deep Space', hex: '#070a13' },
      ],
    });
  }
});

// Procedural high quality vector design fallback
function generateFallbackDesign(prompt: string, type: string) {
  const cleanPrompt = prompt.toLowerCase();
  const title = prompt.length > 25 ? prompt.substring(0, 25) + '...' : prompt;

  if (cleanPrompt.includes('tech') || cleanPrompt.includes('logo') || type === 'logo') {
    return {
      title: `${title} Logo`,
      category: 'Logo Design',
      canvasWidth: 800,
      canvasHeight: 600,
      backgroundColor: '#070a14',
      palette: ['#00f0ff', '#38bdf8', '#818cf8', '#0f172a', '#ffffff'],
      elements: [
        {
          type: 'circle',
          x: 400,
          y: 280,
          radius: 110,
          fill: '#0f172a',
          stroke: '#00f0ff',
          strokeWidth: 4,
          opacity: 0.9,
        },
        {
          type: 'circle',
          x: 400,
          y: 280,
          radius: 80,
          fill: 'transparent',
          stroke: '#818cf8',
          strokeWidth: 2,
          opacity: 0.6,
        },
        {
          type: 'path',
          d: 'M 350 280 L 400 200 L 450 280 L 400 360 Z',
          x: 400,
          y: 280,
          fill: '#00f0ff',
          stroke: '#ffffff',
          strokeWidth: 2,
          opacity: 0.85,
        },
        {
          type: 'text',
          text: prompt.toUpperCase().slice(0, 16) || 'NEXUS TECH',
          x: 400,
          y: 430,
          fontSize: 26,
          fill: '#ffffff',
          stroke: 'none',
          strokeWidth: 0,
        },
        {
          type: 'text',
          text: 'TOUCHLESS CREATIVE LAB',
          x: 400,
          y: 465,
          fontSize: 12,
          fill: '#38bdf8',
          stroke: 'none',
          strokeWidth: 0,
        },
      ],
    };
  }

  // Generic fallback vector design
  return {
    title: `${title} Concept`,
    category: 'Creative Design',
    canvasWidth: 800,
    canvasHeight: 600,
    backgroundColor: '#080c18',
    palette: ['#00f0ff', '#a855f7', '#38bdf8', '#ffffff'],
    elements: [
      {
        type: 'rect',
        x: 250,
        y: 180,
        width: 300,
        height: 200,
        fill: '#0f172a',
        stroke: '#00f0ff',
        strokeWidth: 3,
        opacity: 0.8,
      },
      {
        type: 'circle',
        x: 400,
        y: 280,
        radius: 65,
        fill: '#a855f7',
        stroke: '#ffffff',
        strokeWidth: 2,
        opacity: 0.85,
      },
      {
        type: 'text',
        text: title.toUpperCase(),
        x: 400,
        y: 430,
        fontSize: 22,
        fill: '#ffffff',
        stroke: 'none',
        strokeWidth: 0,
      },
    ],
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`NVX Gesture Studio server running at http://localhost:${port}`);
  });
}

startServer();
