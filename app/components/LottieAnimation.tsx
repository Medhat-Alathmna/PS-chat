"use client";

import dynamic from "next/dynamic";
import { CSSProperties } from "react";

// Dynamic import لتجنب مشاكل SSR
const DotLottieReact = dynamic(
  () =>
    import("@lottiefiles/dotlottie-react").then((mod) => mod.DotLottieReact),
  { ssr: false }
);

interface LottieAnimationProps {
  src: string;
  className?: string;
  style?: CSSProperties;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
}

/**
 * Component wrapper للـ Lottie animations
 * يدعم ملفات .lottie (dotLottie format)
 */
export default function LottieAnimation({
  src,
  className = "",
  style = {},
  loop = true,
  autoplay = true,
  speed = 1,
}: LottieAnimationProps) {
  return (
    <DotLottieReact
      src={src}
      loop={loop}
      autoplay={autoplay}
      speed={speed}
      className={className}
      style={style}
    />
  );
}
