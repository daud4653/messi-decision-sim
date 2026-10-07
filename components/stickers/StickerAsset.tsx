"use client";
import { useEffect, useId, useState } from "react";
import { stickers, type StickerName } from "@/lib/stickers";
export function StickerAsset({
  name = "messiIdle",
  large = false,
}: {
  name?: StickerName;
  large?: boolean;
}) {
  return <StickerContent key={name} name={name} large={large} />;
}
function StickerContent({
  name,
  large,
}: {
  name: StickerName;
  large: boolean;
}) {
  const asset = stickers[name];
  const clipId = useId();
  const [x, y, width, height] = asset.viewBox.split(" ").map(Number);
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">(
    "loading",
  );
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (active) setStatus("loaded");
    };
    image.onerror = () => {
      if (active) setStatus("failed");
    };
    image.src = asset.src;
    return () => {
      active = false;
    };
  }, [asset.src]);
  return (
    <div
      className={`sticker ${large ? "sticker-large" : ""} ${status === "loaded" ? "sticker-art" : ""}`}
      data-sticker={name}
      data-state={status}
    >
      {status !== "loaded" ? (
        <>
          <span className="sticker-top">LIONEL</span>
          <strong>10</strong>
          <span className="sticker-bottom">LA PULGA</span>
        </>
      ) : (
        <svg
          viewBox={asset.viewBox}
          role="img"
          aria-label={asset.label}
          preserveAspectRatio="xMidYMid meet"
          overflow="hidden"
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={x} y={y} width={width} height={height} />
            </clipPath>
          </defs>
          <image href={asset.src} width={asset.width} height={asset.height} clipPath={`url(#${clipId})`} />
        </svg>
      )}
    </div>
  );
}
