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
  ExternalLink,
  Copy,
  ChevronRight,
  Download,
  Globe,
  AlertTriangle,
  Laptop,
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
  const [guideStep, setGuideStep] = useState<"quick" | "remote" | "install" | "folders">("quick");

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
                <span>Guía de Conexión</span>
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
                      Conecta tu servidor Komga o Kavita para sincronizar y descargar tus cómics en cualquier dispositivo.
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
                        <span>Ver cómo conectar</span>
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
placeholder="http://192.168.1.50:25600/opds/v1.2/catalog o https://tu-tunel.com/..."                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-neutral-300">URL del Catálogo OPDS</label>
                    <button
                      type="button"
                      onClick={() => setActiveTab("guide")}
                      className="text-[11px] text-indigo-400 hover:underline"
                    >
                      ¿Qué formato de URL poner?
                    </button>
                  </div>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://tudominio.com/opds/v1.2/catalog o http://localhost:25600/opds/v1.2/catalog"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    En local puedes usar <strong>http://localhost:...</strong>. Para acceso remoto por internet se requiere <strong>https://</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Usuario / Email (Opcional)</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin@komga.org"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Contraseña (Opcional)</label>
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
                    Tus credenciales se almacenan únicamente de forma local en tu navegador.
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
                  1. Formato URLs
                </button>
                <button
                  onClick={() => setGuideStep("remote")}
                  className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                    guideStep === "remote" ? "bg-amber-600/30 text-amber-200 border border-amber-500/40" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  2. Conexión Remota
                </button>
                <button
                  onClick={() => setGuideStep("install")}
                  className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                    guideStep === "install" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  3. Instalar Komga
                </button>
                <button
                  onClick={() => setGuideStep("folders")}
                  className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                    guideStep === "folders" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  4. Carpetas
                </button>
              </div>

              {/* Paso 1: Formatos de URL */}
              {guideStep === "quick" && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl">
                    <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                      <BookOpen size={14} className="text-indigo-400" />
                      Rutas estándar del feed OPDS
                    </h4>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Si pruebas desde esta misma computadora, usa <code className="text-neutral-300 font-mono">http://localhost:...</code>. Si te conectas desde un celular o fuera de casa, usa tu dirección pública o túnel HTTPS.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {/* Komga URL */}
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">Komga (Puerto 25600)</span>
                        <span className="text-[10px] bg-neutral-900 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-800 font-mono">
                          /opds/v1.2/catalog
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-lg font-mono text-[11px] text-neutral-300">
                        <span className="truncate">http://localhost:25600/opds/v1.2/catalog</span>
                        <button
                          onClick={() => handleCopy("http://localhost:25600/opds/v1.2/catalog")}
                          className="text-neutral-400 hover:text-white p-1 ml-2 shrink-0"
                          title="Copiar ruta"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Kavita URL */}
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-400">Kavita (Puerto 5000)</span>
                        <span className="text-[10px] bg-neutral-900 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-800 font-mono">
                          /api/opds/TU-API-KEY
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-lg font-mono text-[11px] text-neutral-300">
                        <span className="truncate">http://localhost:5000/api/opds/TU-API-KEY</span>
                        <button
                          onClick={() => handleCopy("http://localhost:5000/api/opds/")}
                          className="text-neutral-400 hover:text-white p-1 ml-2 shrink-0"
                          title="Copiar prefijo"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        Encuentras tu clave en Kavita &gt; Ajustes de Usuario &gt; Cuenta &gt; OPDS.
                      </p>
                    </div>
                  </div>
                </div>
              )}

{/* Paso 2: Conexión Remota y Túnel */}
{guideStep === "remote" && (
  <div className="space-y-3 text-xs text-neutral-300 animate-in fade-in">
    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 flex items-start gap-2.5 text-[11px] leading-relaxed">
      <Globe size={16} className="shrink-0 mt-0.5 text-indigo-400" />
      <span>
        <strong>Acceso fuera de tu red local:</strong> Si tu servidor corre en la computadora de tu casa y quieres consultar tus cómics desde la calle o en otra red, necesitas una URL pública. Un túnel crea un puente seguro hacia tu máquina sin necesidad de abrir puertos en tu router.
      </span>
    </div>

    {/* Advertencia de equipo encendido */}
    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-start gap-2 text-[11px] text-neutral-400">
      <Laptop size={16} className="shrink-0 mt-0.5 text-indigo-400" />
      <span>
        <strong>Importante:</strong> La computadora donde residen tus cómics debe permanecer encendida para que el catálogo responda a las lecturas y descargas.
      </span>
    </div>

                  {/* Solución 1: Túnel rápido de Cloudflare (Sin dominio) */}
                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Globe size={14} className="text-indigo-400" />
                        Opción A: Túnel Rápido de Cloudflare (Gratis y sin comprar dominio)
                      </h4>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        Instantáneo
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Ejecuta este comando en tu PowerShell (incluyendo <code className="text-indigo-300">--protocol http2</code> para evitar bloqueos de red):
                    </p>
                    <div className="flex items-center justify-between bg-neutral-900 p-2.5 rounded-lg font-mono text-[11px] text-amber-300 border border-neutral-800">
                      <span className="truncate">cloudflared tunnel --protocol http2 --url http://localhost:25600</span>
                      <button
                        onClick={() => handleCopy("cloudflared tunnel --protocol http2 --url http://localhost:25600")}
                        className="text-neutral-400 hover:text-white p-1 ml-2 shrink-0"
                        title="Copiar comando"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Cloudflare te dará una URL temporal tipo <code className="text-neutral-200">https://xxxx.trycloudflare.com</code>. Úsala agregándole <code className="text-indigo-300 font-mono">/opds/v1.2/catalog</code>.
                    </p>
                  </div>

                  {/* Solución 2: Túnel fijo con dominio propio */}
                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Terminal size={14} className="text-indigo-400" />
                      Opción B: Túnel Permanente (Requiere tu propio dominio en Cloudflare)
                    </h4>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Si posees un dominio administrado en Cloudflare, puedes crear un túnel en el panel web de Zero Trust y correrlo como servicio de Windows en segundo plano 24/7 sin necesidad de abrir terminales.
                    </p>
                  </div>
                </div>
              )}

              {/* Paso 3: Instalación de Komga */}
              {guideStep === "install" && (
                <div className="space-y-3 text-xs text-neutral-300 animate-in fade-in">
                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Download size={14} className="text-indigo-400" />
                      Instalar y configurar Komga
                    </h4>
                    <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-neutral-400">
                      <li>
                        Descarga Komga desde su sitio oficial:{" "}
                        <a
                          href="https://komga.org"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 underline inline-flex items-center gap-0.5"
                        >
                          komga.org <ExternalLink size={10} />
                        </a>.
                      </li>
                      <li>Ejecuta el archivo en tu sistema (por defecto corre en el puerto 25600).</li>
                      <li>
                        Abre <span className="text-indigo-400 font-mono">http://localhost:25600</span> en tu navegador y crea tu usuario de administrador.
                      </li>
                      <li>
                        Para conectarlo a este lector web, sigue las instrucciones de la pestaña <strong>2. Conexión Remota</strong>.
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Paso 4: Carpetas y Escaneo */}
              {guideStep === "folders" && (
                <div className="space-y-3 text-xs text-neutral-300 animate-in fade-in">
                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <FolderTree size={14} className="text-amber-400" />
                      Estructura recomendada de archivos
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Organiza tus archivos <code className="text-indigo-300">.cbz</code> o <code className="text-indigo-300">.cbr</code> en carpetas por título para una indexación limpia:
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
                    <h5 className="font-semibold text-white text-xs">Vincular carpeta en el panel de Komga:</h5>
                    <p className="text-[11px] text-neutral-400">
                      En Komga ve a <strong>Bibliotecas &gt; + Añadir biblioteca</strong>, elige tu carpeta y pulsa guardar. El servidor generará los metadatos y portadas automáticamente.
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
            ¡Copiado al portapapeles!
          </div>
        )}
      </div>
    </div>
  );
}