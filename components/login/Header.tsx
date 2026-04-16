import Image from "next/image";
import { LanguageSelector } from "./LanguageSelector";

export function Header() {
  return (
    <header className="absolute top-0 w-full h-16 lg:h-20 bg-[#0B0F12]/80 z-50">
      <div className="h-full max-w-[1440px] mx-auto px-4 sm:px-12 lg:px-36 py-3 flex items-center justify-between">
        {/* A.1 Logo */}
        <div className="flex items-center">
          <Image
            src="/images/saa-logo.png"
            alt="SAA 2025"
            width={52}
            height={48}
            className="w-10 h-10 lg:w-[52px] lg:h-[48px]"
          />
        </div>

        {/* A.2 Language Selector */}
        <LanguageSelector />
      </div>
    </header>
  );
}
