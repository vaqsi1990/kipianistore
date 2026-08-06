"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useCallback } from "react";
import Image from "next/image";
import {
  FaChevronLeft,
  FaChevronRight,
  FaExpand,
  FaCompress,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";

const imageVariants = {
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.3, ease: "easeInOut" },
  },
  enter: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const thumbnailVariants = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.95,
  },
};

function ProductImage({ image }: { image: string[] }) {
  const [current, setCurrent] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const nextImage = useCallback(() => {
    setCurrent((prev) => (prev + 1) % image.length);
  }, [image.length]);

  const prevImage = useCallback(() => {
    setCurrent((prev) => (prev - 1 + image.length) % image.length);
  }, [image.length]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <section className="w-full">
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_auto] gap-6 items-start">
        {/* Main Image Container */}
        <div className="relative w-full  rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
          {/* Loading Skeleton */}
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-2xl" />
          )}

          {/* Main Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial="exit"
              animate="enter"
              exit="exit"
              variants={imageVariants}
              className="relative w-full h-[500px] group"
            >
              <Image
                src={image[current]}
                alt={`Product image ${current + 1}`}
                fill
                className={`object-cover transition-transform duration-300 ${
                  isZoomed ? "scale-110" : "group-hover:scale-105"
                }`}
                priority
                onLoad={handleImageLoad}
                unoptimized
              />

              {/* Zoom Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-2xl" />

              {/* Zoom Button */}
              <Button  variant="outline"
                onClick={() => setIsZoomed(!isZoomed)}
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
              >
                {isZoomed ? (
                  <FaCompress className="w-4 h-4 text-gray-700" />
                ) : (
                  <FaExpand className="w-4 h-4 text-gray-700" />
                )}
              </Button>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          {image.length > 1 && (
            <>
              <Button  variant="outline"
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 z-10"
              >
                <FaChevronLeft className="w-4 h-4 text-gray-700" />
              </Button>
              <Button  variant="outline"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 z-10"
              >
                <FaChevronRight className="w-4 h-4 text-gray-700" />
              </Button>
            </>
          )}

          {/* Image Counter */}
          {image.length > 1 && (
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              {current + 1} / {image.length}
            </div>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {image.length > 1 && (
          <div className="flex flex-col gap-3 w-full lg:w-auto">
          
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {image.map((img, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrent(index)}
                  variants={thumbnailVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className={`relative flex-shrink-0 w-20 h-16 lg:w-16 lg:h-14 rounded-xl overflow-hidden transition-all duration-300 ${
                    current === index
                      ? "ring-3 ring-blue-500 shadow-lg scale-105"
                      : "ring-1 ring-gray-200 hover:ring-2 hover:ring-gray-300 hover:shadow-md"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />

                  {/* Active Indicator */}
                  {current === index && (
                    <div className="absolute inset-0 bg-blue-500/20 rounded-xl" />
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all duration-300 rounded-xl" />
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Screen Modal for Zoomed Image */}
      {isZoomed && (
        <div
          className="fixed inset-0  mt-10  bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-4xl  ">
            <Image
              src={image[current]}
              alt={`Product image ${current + 1}`}
              width={800}
              height={600}
              className="w-full  object-contain rounded-lg"
              unoptimized
            />
            <Button  variant="outline"
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-300"
            >
              <FaCompress className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProductImage;
