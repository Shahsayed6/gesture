import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { soundEffects } from '../../services/soundEffects';
import { Download, X, FileCode, Image, FileJson, Check } from 'lucide-react';

export const ExportModal: React.FC = () => {
  const { showExportModal, setShowExportModal, elements, projectName, backgroundColor, backgroundType } = useStudio();
  const [format, setFormat] = useState<'svg' | 'png' | 'jpg' | 'json'>('svg');
  const [scale, setScale] = useState<number>(2);
  const [copied, setCopied] = useState(false);

  if (!showExportModal) return null;

  // Build clean SVG string representation
  const generateSvgContent = () => {
    let svgInner = '';
    elements.forEach((el) => {
      if (el.visible === false) return;
      const rot = el.rotation ? `transform="rotate(${el.rotation} ${el.x} ${el.y})"` : '';
      const stroke = el.stroke || 'none';
      const fill = el.fill || 'transparent';
      const strokeWidth = el.strokeWidth || 1;
      const opacity = el.opacity ?? 1;

      if (el.type === 'circle') {
        const r = el.radius || (el.width ? el.width / 2 : 40);
        svgInner += `  <circle cx="${el.x}" cy="${el.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" ${rot} />\n`;
      } else if (el.type === 'rect') {
        const w = el.width || 80;
        const h = el.height || 60;
        svgInner += `  <rect x="${el.x - w / 2}" y="${el.y - h / 2}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" ${rot} />\n`;
      } else if (el.type === 'triangle') {
        const w = el.width || 80;
        const h = el.height || 80;
        const pts = `${el.x},${el.y - h / 2} ${el.x + w / 2},${el.y + h / 2} ${el.x - w / 2},${el.y + h / 2}`;
        svgInner += `  <polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" ${rot} />\n`;
      } else if (el.type === 'line') {
        const w = el.width || 120;
        svgInner += `  <line x1="${el.x - w / 2}" y1="${el.y}" x2="${el.x + w / 2}" y2="${el.y}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" ${rot} />\n`;
      } else if (el.type === 'text') {
        svgInner += `  <text x="${el.x}" y="${el.y}" text-anchor="middle" dominant-baseline="middle" font-family="${el.fontFamily || 'sans-serif'}" font-size="${el.fontSize || 20}" font-weight="600" fill="${fill === 'transparent' ? '#ffffff' : fill}" opacity="${opacity}" ${rot}>${el.text || ''}</text>\n`;
      } else if (el.type === 'path' && (el.d || el.points)) {
        const d = el.d || el.points?.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        svgInner += `  <path d="${d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round" ${rot} />\n`;
      }
    });

    const bgRect =
      backgroundType === 'white'
        ? '<rect width="100%" height="100%" fill="#ffffff" />\n'
        : backgroundType === 'black'
        ? '<rect width="100%" height="100%" fill="#000000" />\n'
        : backgroundType === 'dark-grid'
        ? `<rect width="100%" height="100%" fill="${backgroundColor}" />\n`
        : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
${bgRect}${svgInner}</svg>`;
  };

  const handleExport = () => {
    soundEffects.playShapeRecognized();
    const cleanFileName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'nvx-design';

    if (format === 'svg') {
      const svg = generateSvgContent();
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanFileName}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const json = JSON.stringify(
        {
          schema: 'nvx-gesture-studio-v2',
          projectName,
          exportedAt: new Date().toISOString(),
          elements,
        },
        null,
        2
      );
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanFileName}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // PNG or JPG
      const svg = generateSvgContent();
      const img = new window.Image();
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200 * scale;
        canvas.height = 800 * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);
          const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
          canvas.toBlob((blob) => {
            if (blob) {
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `${cleanFileName}.${format}`;
              a.click();
            }
          }, mime, 0.95);
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }

    setShowExportModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel-glow border border-cyan-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-4">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-cyan-400" />
            <h3 className="font-cyber font-bold text-sm tracking-wide text-cyan-200">
              EXPORT CREATIVE DESIGN
            </h3>
          </div>
          <button
            onClick={() => setShowExportModal(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Format Selector */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-cyber">
            Output Format
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'svg', label: 'SVG', desc: 'Vector', icon: FileCode },
              { id: 'png', label: 'PNG', desc: 'Raster', icon: Image },
              { id: 'jpg', label: 'JPG', desc: 'Photo', icon: Image },
              { id: 'json', label: 'JSON', desc: 'Project', icon: FileJson },
            ].map((fmt) => {
              const Icon = fmt.icon;
              return (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id as any)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    format === fmt.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-bold text-xs">{fmt.label}</span>
                  <span className="text-[9px] text-slate-500">{fmt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resolution Scale for PNG / JPG */}
        {(format === 'png' || format === 'jpg') && (
          <div className="mb-5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-cyber">
              Resolution Scale
            </label>
            <div className="flex gap-2">
              {[1, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    scale === s
                      ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {s}x ({1200 * s}x{800 * s}px)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setShowExportModal(false)}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            <Download size={14} />
            Download {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};
