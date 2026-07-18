import React, { useState } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { AudioBubbleView, formatDuration } from "./AudioBubbleView";

/** Native audio message playback (expo-audio). Web uses AudioMessage.web.tsx. */
export function AudioMessage({ uri, mine, durationSec }: { uri: string; mine: boolean; durationSec?: number }) {
  // Freeze the source on first render — the server rotates the presigned URL on
  // every poll, and reacting to that would restart the player mid-message.
  const [src] = useState(uri);
  const player = useAudioPlayer({ uri: src });
  const status = useAudioPlayerStatus(player);
  const playing = !!status?.playing;

  const toggle = () => {
    if (playing) {
      player.pause();
    } else {
      if (status?.didJustFinish) player.seekTo(0);
      player.play();
    }
  };

  const total = durationSec || status?.duration || 0;
  const timeLabel = playing ? formatDuration(status?.currentTime || 0) : formatDuration(total);

  return <AudioBubbleView playing={playing} mine={mine} onToggle={toggle} timeLabel={timeLabel} />;
}
