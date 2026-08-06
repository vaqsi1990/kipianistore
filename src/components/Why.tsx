import React from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'

const Why = () => {
  const params = useParams()
  const locale = params.locale as string

  const whyItems = [
    {
      id: 1,
      title: "ხარისხი",
      titleEn: "Quality",
      description: "ჩვენ ვთავაზობთ მხოლოდ უმაღლეს ხარისხის ავეჯს",
      descriptionEn: "We offer only the highest quality furniture",
      icon: "/icons/high-quality.png"
    },
    {
      id: 2,
      title: "სწრაფი მიწოდება",
      titleEn: "Fast Delivery",
      description: "სწრაფი და უსაფრთხო მიწოდება მთელ საქართველოში",
      descriptionEn: "Fast and secure delivery throughout Georgia",
      icon: "/icons/delivery.png"
    },
    {
      id: 3,
      title: "საუკეთესო ფასები",
      titleEn: "Best Prices",
      description: "კონკურენტუნარიანი ფასები ხარისხის გარეშე",
      descriptionEn: "Competitive prices without compromising quality",
      icon: "/icons/price.png"
    },
    {
      id: 5,
      title: "გარანტია",
      titleEn: "Warranty",
      description: "სრული გარანტია ყველა ჩვენს პროდუქტზე",
      descriptionEn: "Full warranty on all our products",
      icon: "/icons/warranty.png"
    }
  ];

  const getLocalizedTitle = (item: any) => {
    return locale === "en" ? item.titleEn : item.title
  }

  const getLocalizedDescription = (item: any) => {
    return locale === "en" ? item.descriptionEn : item.description
  }

  const getLocalizedHeading = () => {
    return locale === "en" ? "Why Choose Us?" : "რატომ ჩვენ?"
  }

  return (
    <>
      <div className="container mx-auto">
        <div className="max-w-7xl  mx-auto">
          <div className="text-center py-12">
            <h2 className="text-[20px] text-white md:text-[30px] font-bold">{getLocalizedHeading()}</h2>
          </div>
          
          {/* 4-Item Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
            {whyItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white  rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="text-center">
                  {/* Icon Circle */}
                  <div className="w-16 h-16 bg-[#bbb272] rounded-full mx-auto mb-4 flex items-center justify-center shadow-md">
                    <Image
                      src={item.icon}
                      alt={getLocalizedTitle(item)}
                      width={32}
                      height={32}
                      className="w-8 h-8"
                    />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-[18px] md:text-[20px] font-bold text-gray-800 mb-3">
                    {getLocalizedTitle(item)}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-[14px] md:text-[16px] text-gray-600 leading-relaxed">
                    {getLocalizedDescription(item)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default Why