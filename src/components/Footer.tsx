import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { FaPhone, FaMapMarkerAlt, FaFacebook, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { useTranslations } from "next-intl";

const Footer = () => {
  const t = useTranslations("footer");
  const phoneNumber = "+995568613022";
  return ( 
    <footer className="bg-[#2E3A47] text-white">
      <div className=" block md:hidden">
      <div className="  p-3 shadow-lg">
        <div className="flex flex-row items-center gap-y-3 justify-center space-x-3">
          <Link
            href={`https://wa.me/${phoneNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open WhatsApp"
            className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#25D366] shadow-lg hover:scale-105 transition-transform duration-200"
          >
            <FaWhatsapp className="text-white text-[35px]  md:text-[40px]" />
          </Link>
          <Link href="#" className="w-12 h-12 md:w-14 md:h-14 bg-[#1877F2] hover:bg-[#166FE5] rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110" aria-label="Facebook">
            <FaFacebook className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </Link>
          <Link href="#" className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:from-[#9B4DDB] hover:via-[#FF4444] hover:to-[#FF9966] rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110" aria-label="Instagram">
            <FaInstagram className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </Link>
          <Link href="#" className="w-12 h-12 md:w-14 md:h-14 bg-black hover:bg-gray-800 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110" aria-label="TikTok">
            <FaTiktok className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </Link>
        </div>
      </div>
    </div>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">

          {/* Header Section */}
          <div className="mb-12">

            <a
              href="mailto:kipianistore@gmail.com"
              className="text-gray-300 hover:text-white transition-colors duration-300 text-lg block"
            >
              kipianistore@gmail.com
            </a>
          </div>

          {/* Contact Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 w-full">

            {/* Batumi */}
            <div>
              <div className="flex flex-col items-center justify-center mb-4">
                <h3 className="text-xl flex flex-row font-semibold">    <FaMapMarkerAlt className="w-6 h-6 text-[#bbb272] mr-3" /> {t("batumi")}</h3>
                <p className="text-gray-300">{t("batumiAddress")}</p>
                <p className="text-gray-300">{t("batumiAddress2")}</p>
              </div>
              <div className="space-y-2">
                <a href="tel:+995557394374" className="block text-lg text-gray-300 hover:text-white transition">
                  +995 557 394 374
                </a>
                <a href="tel:+995568613022" className="block text-lg text-gray-300 hover:text-white transition">
                  +995 568 613 022
                </a>
              </div>
            </div>

            {/* Kobuleti */}
            <div>
              <div className="flex flex-col items-center justify-center mb-4">
                <h3 className="text-xl flex flex-row font-semibold">    <FaMapMarkerAlt className="w-6 h-6 text-[#bbb272] mr-3" /> {t("kobuleti")}</h3>
                <p className="text-gray-300">{t("kobuletiAddress")}</p>
              </div>
              <div className="space-y-2">
                <a href="tel:+995555244403" className="block text-lg text-gray-300 hover:text-white transition">
                  +995 555 244 403
                </a>
                <a href="tel:+995597808047" className="block text-lg text-gray-300 hover:text-white transition">
                  +995 597 808 047
                </a>
              </div>
            </div>

            {/* Kutaisi */}
            <div>
              <div className="flex flex-col items-center justify-center mb-4">
                <h3 className="text-xl flex flex-row font-semibold">    <FaMapMarkerAlt className="w-6 h-6 text-[#bbb272] mr-3" /> {t("kutaisi")}</h3>
                <p className="text-gray-300">{t("kutaisiAddress")}</p>
              </div>
              <div className="space-y-2">
                <a href="tel:+99551407989" className="block text-lg text-gray-300 hover:text-white transition">
                  +995 514 079 89
                </a>
              </div>
            </div>

            <div>
              <div className="flex flex-col items-center justify-center mb-4">

                <h3 className="text-xl flex flex-row font-semibold">    <FaMapMarkerAlt className="w-6 h-6 text-[#bbb272] mr-3" /> {t("tbilisi")}</h3>
                <p className="text-gray-300">{t("tbilisiAddress")}</p>
              </div>
              <div className="space-y-2">
                <a href="tel:+995557226880" className="block text-lg text-gray-300 hover:text-white transition">
                  +995557226880
                </a>
              </div>
            </div>
          </div>

          {/* Social Media */}
        
        </div>
      </div>
    </footer>

  );
};

export default Footer;
