import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Link } from "@/i18n/navigation";

interface BrandData {
  src: string;
  name: string;
  type: string;
}

interface BrandItemProps {
  images: string[];
  from?: number | string;
  to?: number | string;
  brands?: BrandData[];
}

function BrandItem({ images, from, to, brands }: BrandItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Use provided brands data or fallback to images with default names
  const brandData = brands || images.map((image, index) => ({
    src: image,
    name: `Brand ${index + 1}`,
    type: `brand${index + 1}`
  }));

  // Create multiple copies of the brands for seamless infinite scroll
  const repeatedBrands = [...brandData, ...brandData, ...brandData, ...brandData];

  const startAnimation = useCallback(() => {
    if (!containerRef.current || isHovered) return;

    setIsAnimating(true);
    let startTime: number;
    let currentX = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Calculate the distance to move for one complete cycle
      const itemWidth = 192; // w-48 (48 * 4px = 192px)
      const gap = 64; // space-x-16 (16 * 4px = 64px)
      const totalItemWidth = itemWidth + gap;
      const cycleDistance = brandData.length * totalItemWidth;
      
      // Speed: pixels per second (adjust this value to control speed)
      const speed = 50; // 50px per second
      const distance = (elapsed / 1000) * speed;
      
      // Calculate current position with seamless loop
      currentX = -(distance % cycleDistance);

      if (containerRef.current) {
        containerRef.current.style.transform = `translateX(${currentX}px)`;
      }

      if (!isHovered) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isHovered, brandData.length]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    setIsAnimating(false);
  }, []);

  useEffect(() => {
    if (isHovered) {
      stopAnimation();
    } else {
      startAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [isHovered, startAnimation, stopAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={containerRef}
        className="flex items-center space-x-8 sm:space-x-12 md:space-x-16"
        style={{
          transform: 'translateX(0px)',
          willChange: 'transform',
        }}
      >
        {repeatedBrands.map((brand, index) => (
          <Link 
            key={`${brand.type}-${index}`}
            href={`/list?brand=${brand.type}`}
            className="flex-shrink-0 group"
            data-discover="true"
          >
            <div className="relative w-40 h-24 sm:w-48 sm:h-28 md:w-56 md:h-32 lg:w-64 lg:h-36 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-gray-100">
              <Image
                src={brand.src}
                alt={`${brand.name} logo`}
                fill
                className="object-contain p-4 group-hover:filter group-hover:brightness-110 transition-all duration-300"
                priority={index < 10} // Prioritize first 10 images for better loading
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default BrandItem;
