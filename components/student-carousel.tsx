"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

const studentImages = Array.from({ length: 27 }, (_, i) => `/images/students/student-${i + 1}.jpg`);

export function StudentCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let scrollPos = 0;

    const scroll = () => {
      if (!isHovered) {
        scrollPos += 0.5;
        if (scrollPos >= scrollContainer.scrollWidth / 2) {
          scrollPos = 0;
        }
        scrollContainer.scrollLeft = scrollPos;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered]);

  return (
    <div 
      className="relative w-full overflow-hidden py-8 bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-hidden whitespace-nowrap px-4"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Double the images for seamless loop */}
        {[...studentImages, ...studentImages].map((src, index) => (
          <div 
            key={index}
            className="inline-block h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-2 border-white dark:border-slate-800 shadow-lg"
          >
            <Image
              src={src}
              alt={`Student ${index + 1}`}
              width={128}
              height={128}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
