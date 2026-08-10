"use client";
import BrandSlider from "@/components/BrandSlider";
import Categories from "@/components/Categories";
import ProductList from "@/components/ProductList";

import React, { Suspense } from "react";
import ElegantHeroSlider from "@/components/ElegantHeroSlider";
import Why from "@/components/Why";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <ElegantHeroSlider />
      <Suspense fallback={<LoadingSpinner />}>
        <Why />
      </Suspense>
      <div className="w-full">
        <Suspense fallback={<LoadingSpinner />}>
          <Categories />
        </Suspense>
        <Suspense fallback={<LoadingSpinner />}>
          <BrandSlider />
        </Suspense>

        <div className="">
          <Suspense fallback={<LoadingSpinner />}>
            <ProductList />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
