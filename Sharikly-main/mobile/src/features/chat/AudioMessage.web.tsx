import React, { useEffect, useRef, useState } from "react";
import { AudioBubbleView, formatDuration } from "./AudioBubbleView";

/** Web audio message playback via the browser HTMLAudioElement. */
export function AudioMessage({ uri, mine, durationSec }: { uri: string; mine: boolean; durationSec?: number }) {
  // Freeze the source on first render: the server hands out a fresh presigned
  // URL (new signature) on every poll, and reacting to that would recreate the
  // element and stop playback mid-message.
  const [src] = useState(uri);
  const audioRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const g = globalThis as any;
    const a = new g.Audio(src);
    audioRef.current = a;
    const onEnd = () => { setPlaying(false); setElapsed(0); };
    const onTime = () => setElapsed(a.currentTime || 0);
    a.addEventListener("ended", onEnd);
    a.addEventListener("timeupdate", onTime);
    return () => {
      try { a.pause(); } catch { /* ignore */ }
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("timeupdate", onTime);
    };
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const total = durationSec || 0;
  const timeLabel = playing ? formatDuration(elapsed) : formatDuration(total);

  return <AudioBubbleView playing={playing} mine={mine} onToggle={toggle} timeLabel={timeLabel} />;
}
