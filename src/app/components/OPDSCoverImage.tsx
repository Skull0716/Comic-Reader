// src/app/components/OPDSCoverImage.tsx
"use client";

import React, { useState, useEffect } from "react";
import { OPDSServerConfig } from "../types/opds";
import { ImageOff, Loader2 } from "lucide-react";

interface Props {
  coverUrl?: string;
  server: OPDSServerConfig;
  alt: string;
}

export default function OPDSCoverImage({ coverUrl, server, alt }: Props) {
  const [blobSrc, setBlobSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(coverUrl));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!coverUrl) return;

    let isMounted = true;
    let objectUrl: string | null = null;
    const controller = new AbortController();

    async function loadCover() {
      try {
        const res = await fetch("/api/opds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUrl: coverUrl,
            username: server.username,
            password: server.password,
            isImage: true,
          }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Error al descargar portada");

        const blob = await res.blob();
        if (isMounted) {
          objectUrl = URL.createObjectURL(blob);
          setBlobSrc(objectUrl);
          setError(false);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadCover();

    return () => {
      isMounted = false;
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [coverUrl, server.username, server.password]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-600">
        <Loader2 size={20} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !blobSrc) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-600 p-2 text-center">
        <ImageOff size={24} />
      </div>
    );
  }

  return (
    <img
      src={blobSrc}
      alt={alt}
      loading="lazy"
      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
    />
  );
}