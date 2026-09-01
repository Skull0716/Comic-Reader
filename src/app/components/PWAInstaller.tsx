// src/app/components/PWAInstaller.tsx
"use client";

import { useEffect } from "react";
import { requestPersistentStorage } from "../utils/storageCleanup";

export default function PWAInstaller() {
  useEffect(() => {
    // 1. Registrar Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registrado con éxito:", reg.scope))
        .catch((err) => console.warn("Error registrando Service Worker:", err));
    }

    // 2. Pedir persistencia de cuota en disco al navegador
    requestPersistentStorage();
  }, []);

  return null;
}