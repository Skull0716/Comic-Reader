// src/app/components/OPDSServerSettingsModal.tsx
"use client";

import React, { useState } from "react";
import {
  X,
  Server,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  HelpCircle,
  BookOpen,
  FolderTree,
  Terminal,
  Smartphone,
  ExternalLink,
  Copy,
  ChevronRight,
  Download,
} from "lucide-react";
import { OPDSServerConfig } from "../types/opds";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectServer: (server: OPDSServerConfig) => void;
}

const STORAGE_KEY = "comic_reader_opds_servers";

function getStoredServers(): OPDSServerConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function OPDSServerSettingsModal({ isOpen, onClose, onSelectServer }: Props) {
  const [servers, setServers] = useState<OPDSServerConfig[]>(getStoredServers);
  const [activeTab, setActiveTab] = useState<"servers" | "guide">("servers");
  const [guideStep, setGuideStep] = useState<"quick" | "install" | "folders" | "mobile">("quick");

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSaveServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    const newServer: OPDSServerConfig = {
      id: crypto.randomUUID(),
      name: name.trim(),
      url: url.trim(),
      username: username.trim() || undefined,
      password: password.trim() || undefined,
    };

    const updated = [...servers, newServer];
    setServers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setName("");
    setUrl("");
    setUsername("");
    setPassword("");
    setIsAdding(false);
  };

  const handleDeleteServer = (id: string) => {
    const updated = servers.filter((s) => s.id !== id);
    setServers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-text"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-neutral-100"
      >
        {/* Cabecera Principal */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <Server size={18} className="text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Servidores OPDS (Komga / Kavita)</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
              <button
                onClick={() => {
                  setActiveTab("servers");
                  setIsAdding(false);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  activeTab === "servers"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Mis Servidores
              </button>
              <button
                onClick={() => setActiveTab("guide")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === "guide"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <HelpCircle size={14} />
                <span>Manual de Instalación</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Cuerpo del Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "servers" ? (
            !isAdding ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Servidores guardados en este dispositivo</span>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Añadir Servidor</span>
                  </button>
                </div>

                {servers.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/40">
                    <BookOpen size={40} className="mx-auto text-neutral-600 mb-2.5 stroke-[1.5]" />
                    <p className="text-xs font-semibold text-neutral-300">No tienes servidores configurados</p>
                    <p className="text-[11px] text-neutral-500 mt-1 max-w-sm mx-auto">
                      Conecta tu propio servidor de cómics para sincronizar y descargar tus lecturas en cualquier lugar.
                    </p>
                    <div className="flex items-center justify-center gap-2.5 mt-5">
                      <button
                        onClick={() => setIsAdding(true)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        Añadir servidor
                      </button>
                      <button
                        onClick={() => setActiveTab("guide")}
                        className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                      >
                        <HelpCircle size={13} />
                        <span>Ver guía paso a paso</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {servers.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl hover:border-neutral-700 transition"
                      >
                        <div className="min-w-0 pr-3">
                          <h4 className="text-xs font-bold text-white truncate">{s.name}</h4>
                          <p className="text-[11px] text-neutral-500 font-mono truncate">{s.url}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              onSelectServer(s);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
                          >
                            <Check size={14} />
                            <span>Conectar</span>
                          </button>
                          <button
                            onClick={() => s.id && handleDeleteServer(s.id)}
                            className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-900 transition cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleSaveServer} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Nombre del Servidor</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej. Komga en PC"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-neutral-300">URL de Catálogo OPDS</label>
                    <button
                      type="button"
                      onClick={() => setActiveTab("guide")}
                      className="text-[11px] text-indigo-400 hover:underline"
                    >
                      ¿Cómo obtengo mi URL?
                    </button>
                  </div>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="http://localhost:25600/opds/v1.2/catalog"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Usuario / Email</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin@komga.org"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Contraseña</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-indigo-950/30 border border-indigo-800/30 rounded-xl text-[11px] text-indigo-300 flex items-start gap-2">
                  <ShieldCheck size={16} className="shrink-0 mt-0.5 text-indigo-400" />
                  <span>
                    Las credenciales no se envían a ningún servidor externo. Solo se guardan de forma local en tu navegador.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-white rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Guardar Servidor
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Guía Detallada Paso a Paso */
            <div className="space-y-4">
              {/* Sub-navegación de la guía */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setGuideStep("quick")}
                  className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                    guideStep === "quick" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  1. URLs Rápidas
                </button>
                <button
                  onClick={() => setGuideStep("install")}
                  className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                    guideStep === "install" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  2. Instalar Komga
                </button>
                <button
                  onClick={() => setGuideStep("folders")}
                  className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                    guideStep === "folders" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  3. Carpetas & Cómics
                </button>
                <button
                  onClick={() => setGuideStep("mobile")}
                  className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                    guideStep === "mobile" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  4. Celular & Túnel
                </button>
              </div>

              {/* Paso 1: URLs Rápidas */}
              {guideStep === "quick" && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl">
                    <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                      <BookOpen size={14} className="text-indigo-400" />
                      ¿Qué es OPDS y cómo funciona?
                    </h4>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      OPDS es el estándar que permite conectar tu servidor personal con este lector web. Te permite explorar tomos, ver portadas y descargarlos a tu dispositivo para leerlos 100% offline.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-neutral-300">Formatos estándar de URL OPDS:</span>

                    {/* Komga URL */}
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">Komga (PC Local)</span>
                        <span className="text-[10px] bg-neutral-900 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-800 font-mono">
                          Puerto 25600
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-lg font-mono text-[11px] text-neutral-300">
                        <span className="truncate">http://localhost:25600/opds/v1.2/catalog</span>
                        <button
                          onClick={() => handleCopy("http://localhost:25600/opds/v1.2/catalog")}
                          className="text-neutral-400 hover:text-white p-1 ml-2 shrink-0"
                          title="Copiar"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Kavita URL */}
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-400">Kavita</span>
                        <span className="text-[10px] bg-neutral-900 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-800 font-mono">
                          Puerto 5000
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-lg font-mono text-[11px] text-neutral-300">
                        <span className="truncate">http://localhost:5000/api/opds/TU-API-KEY</span>
                        <button
                          onClick={() => handleCopy("http://localhost:5000/api/opds/TU-API-KEY")}
                          className="text-neutral-400 hover:text-white p-1 ml-2 shrink-0"
                          title="Copiar"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 2: Instalación de Komga */}
              {guideStep === "install" && (
                <div className="space-y-3 text-xs text-neutral-300 animate-in fade-in">
                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Download size={14} className="text-indigo-400" />
                      1. Descargar e iniciar Komga
                    </h4>
                    <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-neutral-400">
                      <li>
                        Entra a la página oficial{" "}
                        <a
                          href="https://komga.org"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 underline inline-flex items-center gap-0.5"
                        >
                          komga.org <ExternalLink size={10} />
                        </a>{" "}
                        y descarga el ejecutable para Windows, Mac o Docker.
                      </li>
                      <li>Ejecuta Komga (o corre su archivo <code className="bg-neutral-900 px-1 py-0.5 rounded text-neutral-300">.exe</code>).</li>
                      <li>
                        Abre tu navegador y entra a:{" "}
                        <span className="text-indigo-400 font-mono">http://localhost:25600</span>
                      </li>
                      <li>Crea tu primera cuenta de administrador (escribe un correo y contraseña que recuerdes).</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Paso 3: Carpetas y Escaneo */}
              {guideStep === "folders" && (
                <div className="space-y-3 text-xs text-neutral-300 animate-in fade-in">
                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <FolderTree size={14} className="text-amber-400" />
                      Organización recomendada de carpetas
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Para que Komga reconozca sagas y números automáticamente, organiza tus archivos <code className="text-indigo-300">.cbz</code> o <code className="text-indigo-300">.cbr</code> de esta forma:
                    </p>
                    <div className="bg-neutral-900 p-3 rounded-xl font-mono text-[11px] text-neutral-300 border border-neutral-800 leading-relaxed">
                      📁 Cómics/<br />
                      &nbsp;&nbsp;└── 📁 Batman - Año Uno/<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Batman #01.cbz<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── Batman #02.cbz<br />
                      &nbsp;&nbsp;└── 📁 Spider-Man/<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── Spider-Man #01.cbz
                    </div>
                  </div>

                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                    <h5 className="font-semibold text-white text-xs">Añadir la biblioteca en el panel de Komga:</h5>
                    <p className="text-[11px] text-neutral-400">
                      En Komga haz clic en <strong>Bibliotecas &gt; + Añadir biblioteca</strong>, selecciona tu carpeta de cómics y pulsa guardar. En las opciones de análisis, activa <strong>&quot;Calcular hash de los archivos&quot;</strong> y <strong>&quot;Analizar dimensión de páginas&quot;</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Paso 4: Celular y Túnel Remoto */}
              {guideStep === "mobile" && (
                <div className="space-y-3 text-xs text-neutral-300 animate-in fade-in">
                  {/* Wi-Fi local */}
                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Smartphone size={14} className="text-sky-400" />
                      Opción A: Leer en el celular con el mismo Wi-Fi
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      En tu PC abre la terminal (PowerShell) y escribe <code className="bg-neutral-900 px-1 py-0.5 rounded text-neutral-200">ipconfig</code> para ver tu dirección IPv4 (ej. 192.168.1.50).
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      En el celular, pon tu URL OPDS con esa IP:
                    </p>
                    <div className="bg-neutral-900 p-2 rounded-lg font-mono text-[11px] text-indigo-300 border border-neutral-800">
                      http://192.168.1.50:25600/opds/v1.2/catalog
                    </div>
                  </div>

                  {/* Fuera de casa con Cloudflare */}
                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Terminal size={14} className="text-amber-400" />
                      Opción B: Leer fuera de casa con datos móviles (Cloudflare Tunnel)
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Si tienes <code className="text-neutral-200">cloudflared</code> instalado, ejecuta en tu terminal:
                    </p>
                    <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-lg font-mono text-[11px] text-amber-300 border border-neutral-800">
                      <span>cloudflared tunnel --url http://localhost:25600</span>
                      <button
                        onClick={() => handleCopy("cloudflared tunnel --url http://localhost:25600")}
                        className="text-neutral-400 hover:text-white p-1 ml-2 shrink-0"
                        title="Copiar comando"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Copia la URL pública generada tipo <code className="text-neutral-300">https://xxxx.trycloudflare.com/opds/v1.2/catalog</code> y úsala en tu app.
                    </p>
                  </div>
                </div>
              )}

              {/* Botón de acción al pie de la guía */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setActiveTab("servers");
                    setIsAdding(true);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <span>Entendido, configurar mi servidor ahora</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notificación flotante de copiado */}
        {copiedText && (
          <div className="fixed bottom-6 right-6 bg-emerald-600 text-white text-xs px-3.5 py-2 rounded-xl shadow-2xl animate-in fade-in z-50">
            ¡Texto copiado al portapapeles!
          </div>
        )}
      </div>
    </div>
  );
}