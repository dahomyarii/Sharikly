import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAudioRecorder,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from "expo-audio";
import type { UploadAsset } from "@/services/api/endpoints/chat";

/**
 * Native voice recorder (expo-audio). The web build uses useVoiceRecorder.web.ts
 * (MediaRecorder) so expo-audio is never imported on web.
 */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const startTimer = () => {
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };
  useEffect(() => () => stopTimer(), []);

  const start = useCallback(async (): Promise<boolean> => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) return false;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      startTimer();
      return true;
    } catch {
      return false;
    }
  }, [recorder]);

  const stop = useCallback(async (): Promise<UploadAsset | null> => {
    stopTimer();
    setIsRecording(false);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return null;
      return { uri, name: `voice-${Date.now()}.m4a`, mimeType: "audio/m4a" };
    } catch {
      return null;
    }
  }, [recorder]);

  const cancel = useCallback(async () => {
    stopTimer();
    setIsRecording(false);
    try {
      await recorder.stop();
    } catch {
      /* ignore */
    }
  }, [recorder]);

  return { isRecording, seconds, start, stop, cancel };
}
