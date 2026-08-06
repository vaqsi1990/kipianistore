"use client";
import BrandSlider from "@/components/BrandSlider";
import Categories from "@/components/Categories";
import ProductList from "@/components/ProductList";

import React, { useState, Suspense, useEffect } from "react";
import { getAllProducts } from "@/lib/actions/actions";
import ElegantHeroSlider from "@/components/ElegantHeroSlider";
import Why from "@/components/Why";

// Loading component for Suspense boundaries
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const HomePage = () => {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { products } = await getAllProducts();
      setCategories(Array.from(new Set(products.map((p: any) => p.category))));
    };
    fetchCategories();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content Area */}
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
