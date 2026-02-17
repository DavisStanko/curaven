"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

const BACKGROUND_IMAGES: string[] = [
  "/bg/20191108_124057-1251675282.jpg",
  "/bg/4028686-scaled-494128580.jpg",
  "/bg/Carleton-University-scaled-3661958822.webp",
  "/bg/CarletonUniversity-2736941696.jpg",
  "/bg/MacOdrum-Library-Exterior-2749083799.jpg",
  "/bg/OIP-3142483453.jpg",
  "/bg/carleton-student-residence-exterior-day-2945896839.jpg",
  "/bg/d50ee7_969590294c8a4ead94ac1d22b014c556~mv2-3796330513.jpg",
  "/bg/tunnel.jpg",
] as const;

function pickRandomBackground(exclude?: string) {
  if (BACKGROUND_IMAGES.length <= 1) {
    return BACKGROUND_IMAGES[0];
  }

  let next =
    BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
  while (next === exclude) {
    next =
      BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
  }

  return next;
}

type BackgroundLayerProps = {
  initialBackgroundImage: string;
};

export function BackgroundLayer({
  initialBackgroundImage,
}: BackgroundLayerProps) {
  const [backgroundImage, setBackgroundImage] = useState<string>(
    initialBackgroundImage,
  );

  const handleChangeBackground = () => {
    setBackgroundImage((current) => pickRandomBackground(current));
  };

  return (
    <>
      <div className="fixed inset-0 z-[-1]">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-300"
          style={{ backgroundImage: `url('${backgroundImage}')` }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-none" />
      </div>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={handleChangeBackground}
        className="fixed bottom-3 right-3 z-20 h-8 gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 text-[11px] text-white/60 backdrop-blur-md hover:bg-black/60 hover:text-white/90 sm:px-3"
        title="Change background"
      >
        <ImageIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">BG</span>
      </Button>
    </>
  );
}

