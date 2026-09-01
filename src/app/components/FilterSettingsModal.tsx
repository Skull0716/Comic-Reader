// components/FilterSettingsModal.tsx
"use client";

import React from "react";
import { ImageFilterSettings, VisualPreset } from "../types/filters";
import { Sun, Moon, Sparkles, Sliders, X, RotateCcw } from "lucide-react";

interface Props {
  settings: ImageFilterSettings;
  onChange: (settings: ImageFilterSettings) => void;
  onClose: () => void;
}

export default function FilterSettingsModal({ settings, onChange, onClose }: Props) {
  const updatePreset = (preset: VisualPreset) => {
    onChange({ ...settings, preset });
  };

  const resetFilters = () => {
    onChange({
      preset: "normal",
      brightness: 100,
      contrast: 100,
      invert: false,
    });
  };

  return (
    <div className="absolute top-16 right-4 z-50 w-80 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-2xl p-5 shadow-2xl text-neutral-200 select-none animate-in fade-in duration-150">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sliders size={16} className="text-indigo-400" />
          <span>Filtros y Modo Nocturno</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={resetFilters}
            title="Restablecer"
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Selector de Presets */}
      <div className="mt-4 space-y-2">
        <label className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          Ambiente de Lectura
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: "normal", label: "Original", icon: Sparkles },
            { id: "night", label: "OLED / Noche", icon: Moon },
            { id: "sepia", label: "Cálido", icon: Sun },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = settings.preset === item.id;
            return (
              <button
                key={item.id}
                onClick={() => updatePreset(item.id as VisualPreset)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition ${
                  isSelected
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm"
                    : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                <Icon size={16} className="mb-1" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders de Brillo y Contraste */}
      <div className="mt-5 space-y-4">
        <div>
          <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
            <span>Brillo</span>
            <span className="font-mono text-neutral-200">{settings.brightness}%</span>
          </div>
          <input
            type="range"
            min={40}
            max={140}
            value={settings.brightness}
            onChange={(e) =>
              onChange({ ...settings, brightness: Number(e.target.value) })
            }
            className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
            <span>Contraste</span>
            <span className="font-mono text-neutral-200">{settings.contrast}%</span>
          </div>
          <input
            type="range"
            min={60}
            max={160}
            value={settings.contrast}
            onChange={(e) =>
              onChange({ ...settings, contrast: Number(e.target.value) })
            }
            className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}