"use client";

import { useEffect, useRef } from "react";
import { useStoryMusic } from "@/lib/hooks/useStoryMusic";
import { useBackgroundMusicContext } from "../../layout";

export default function StoriesLayout({ children }: { children: React.ReactNode }) {
  const storyMusic = useStoryMusic();
  const backgroundMusic = useBackgroundMusicContext();
  const wasMainMusicPlaying = useRef(false);

  // On mount: remember if main music was playing, pause it
  useEffect(() => {
    wasMainMusicPlaying.current = backgroundMusic.isPlaying;
    if (backgroundMusic.isPlaying) {
      backgroundMusic.pause();
    }
    // On unmount: stop story music, resume main if it was playing before
    return () => {
      storyMusic.pause();
      if (wasMainMusicPlaying.current) {
        backgroundMusic.play();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play story music once it's loaded (only if main music was playing)
  useEffect(() => {
    if (storyMusic.isLoaded && wasMainMusicPlaying.current) {
      storyMusic.play();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyMusic.isLoaded]);

  return <>{children}</>;
}
