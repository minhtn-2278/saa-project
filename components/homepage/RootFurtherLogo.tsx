import Image from "next/image";

export function RootFurtherLogo() {
  return (
    <div className="flex flex-col items-center gap-0 pt-6 pb-2 sm:pt-8 sm:pb-3 lg:pt-10 lg:pb-4 max-w-[1512px] mx-auto w-full">
      <Image
        src="/images/content-bg-1.png"
        alt=""
        width={189}
        height={67}
        className="w-[140px] sm:w-[160px] lg:w-[189px] h-auto object-contain"
        aria-hidden="true"
      />
      <Image
        src="/images/content-bg-2.png"
        alt=""
        width={290}
        height={67}
        className="w-[210px] sm:w-[250px] lg:w-[290px] h-auto object-contain"
        aria-hidden="true"
      />
    </div>
  );
}
