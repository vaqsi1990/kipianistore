import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
export default function SideLogo() {
  const phoneNumber = "+995568613022";

  return (
    <div className="fixed hidden md:block bottom-[75px] right-[0px] md:right-[15px] z-50">
      <div className="bg-white rounded-2xl p-3 shadow-lg">
        <div className="flex flex-col items-center gap-y-3 justify-center space-x-3">
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
  );
}
