"use client";

import Image from "next/image";

import { useTranslations } from 'next-intl';

import { useState, useEffect } from "react";
import SideBar from "./Sidebar";
import { Button } from "./ui/button";



const Hero = () => {
  const t = useTranslations('hero');
  const [sidebarOpen, setSideBarOpen] = useState(false);
  
  const handleViewSidebar = () => {
    setSideBarOpen(!sidebarOpen);
  };
  return (
    <section className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="container mx-auto">
        <div className="max-w-7xl mx-auto">

      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Main Container */}
      <div className="relative z-10 mt-16 mb-[40px] flex items-center">
        <div className="container mx-auto ">
          <div className="grid lg:grid-cols-2 gap-5 items-center">
            
            {/* Left Content */}
            <div className="space-y-6 lg:space-y-8">
              {/* Badge */}
              <div>
               
              </div>

             
              <div className="space-y-4">
                <h1 className=" text-3xl md:text-5xl  font-light text-gray-900 leading-tight">
                {t('title2')}
                  <span className="block font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent leading-tight">
  {t('title3')}
</span>
                  {t('title4')}
                </h1>
              </div>

              {/* Description */}
              <p className="text-xl  max-w-lg leading-relaxed">
                {t('description')}
              </p>

              {/* CTA Section - Filter moved outside motion div */}
              <div className="flex flex-col sm:flex-row gap-4">
              <div className="mb-4 flex justify-start">
       
      </div>
                <button
                  onClick={handleViewSidebar}
                 className="w-[50%] px-4 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors"
                >
                 
                 {t('filter')}
                </button>
                
                {/* Filter Sidebar - Rendered outside motion context */}
                {/* <div className="w-full sm:w-auto">
                  <ClientOnlyFilterSidebar />
                </div> */}
              </div>

              {/* SideBar Component */}
              <SideBar isOpen={sidebarOpen} toggleSidebar={handleViewSidebar} onFilterChange={() => {}} />

           
            </div>

            {/* Right Side - Image Grid */}
            <div className="relative lg:mt-0">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 h-[400px] sm:h-[500px] lg:h-[600px]">
                {/* Main Image */}
                <div className="relative mt-5 col-span-2 h-48 sm:h-64 lg:h-80 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl">
                  <Image
                    src="/slider/1.jpg"
                    alt="Luxury furniture"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Side Images */}
                <div className="relative h-32 sm:h-40 rounded-lg sm:rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src="/slider/2.jpg"
                    alt="Modern chair"
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="relative h-32 sm:h-40 rounded-lg sm:rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src="/slider/3.jpg"
                    alt="Elegant sofa"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Floating Card */}
        
            </div>
          </div>
        </div>
      </div>

        </div>
      </div>

  
    </section>
  );
};

export default Hero;