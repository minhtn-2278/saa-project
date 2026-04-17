"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string;
  name: string;
}

export function AwardImage({ src, name }: Props) {
  const [errored, setErrored] = useState(false);

  return (
    <div className="relative w-full max-w-[336px] aspect-square lg:w-[336px] lg:h-[336px] bg-[#00101A] overflow-hidden mx-auto lg:mx-0 shrink-0">
      {!errored ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="(max-width: 768px) 336px, 336px"
          className="object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
          <span className="text-2xl font-bold text-[#FFEA9E]">{name}</span>
        </div>
      )}
    </div>
  );
}
