"use client";
import React from "react";

import { useTranslations } from "next-intl";
import BrandItem from "./BrandItem";

// Import logo images
import one from "../../public/logos/1.png";
import two from "../../public/logos/2.png";

import four from "../../public/logos/4.png";
import five from "../../public/logos/5.png";
import six from "../../public/logos/6.png";

const logos = [
  { src: one.src, name: "Sevyat", type: "sevyat" },
  { src: two.src, name: "idaş", type: "idaş" },
  { src: four.src, name: "İsbiryatak", type: "isbiryatak" },
  { src: five.src, name: "SleepNice", type: "sleepnice" },

  { src: six.src, name: "SleepAndBed", type: "sleepandbed" },
];

function BrandSlider() {
  const t = useTranslations("brands");

  return (
    <section className="max-w-7xl pt-12 mx-auto">
      <div >
   

        {/* Brands Container */}
        <div className="relative">
         
          <div className="overflow-hidden">
            <BrandItem
              images={logos.map((logo) => logo.src)}
              brands={logos}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default BrandSlider;
