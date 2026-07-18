import { useCallback, useEffect, useRef, useState } from "react";
import type { UploadAsset } from "@/services/api/endpoints/chat";

/**
 * Web voice recorder using the browser MediaRecorder API (expo-audio's web
 * recording layer is unreliable in desktop browsers, so we use the native
 * browser API directly — same reasoning as the Location/Geolocation fix).
 */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mrRef = useRef<any>(null);
  const chunksRef = useRef<any[]>([]);
  const streamRef = useRef<any>(null);

  const startTimer = () => {
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };
  useEffect(() => () => stopTimer(), []);

  const cleanup = () => {
    try {
      streamRef.current?.getTracks?.().forEach((t: any) => t.stop());
    } catch {
      /* ignore */
    }
    streamRef.current = null;
    mrRef.current = null;
    chunksRef.current = [];
  };

  const start = useCallback(async (): Promise<boolean> => {
    const g = globalThis as any;
    if (!g?.navigator?.mediaDevices?.getUserMedia || typeof g.MediaRecorder === "undefined") {
      return false;
    }
    try {
      const stream = await g.navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new g.MediaRecorder(stream);
      mr.ondataavailable = (e: any) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };
      mr.start();
      mrRef.current = mr;
      setIsRecording(true);
      startTimer();
      return true;
    } catch {
      return false;
    }
  }, []);

  const stop = useCallback(async (): Promise<UploadAsset | null> => {
    stopTimer();
    setIsRecording(false);
    const g = globalThis as any;
    const mr = mrRef.current;
    if (!mr) return null;
    const type = mr.mimeType || "audio/webm";
    const blob: Blob = await new Promise((resolve) => {
      mr.onstop = () => resolve(new g.Blob(chunksRef.current, { type }));
      try {
        mr.stop();
      } catch {
        resolve(new g.Blob(chunksRef.current, { type }));
      }
    });
    cleanup();
    const uri = g.URL.createObjectURL(blob);
    const ext = (type.split("/")[1] || "webm").split(";")[0];
    return { uri, name: `voice-${Date.now()}.${ext}`, mimeType: type };
  }, []);

  const cancel = useCallback(async () => {
    stopTimer();
    setIsRecording(false);
    try {
      mrRef.current?.stop();
    } catch {
      /* ignore */
    }
    cleanup();
  }, []);

  return { isRecording, seconds, start, stop, cancel };
}
