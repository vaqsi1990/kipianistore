"use client";

import { Link } from "@/i18n/navigation";
import React from "react";
import Menu from "./Menu";
import Image from "next/image";
import SearchBar from "./SearchBar";
import NavIcons from "./NavIcons";
import StoreSelector from "./StoreSelector";
import { useTranslations } from "next-intl";

function Navbar() {
  const t = useTranslations("navitems");

  return (
    <div className="fixed top-0 left-0 w-full z-[800] h-20 px-4 md:px-8 bg-[#869dab] text-black shadow-sm pointer-events-auto isolate">
      <div className="h-full flex items-center justify-between md:hidden">
        <Link className="text-2xl tracking-wide" href="/">
          <Image
            className="rounded-full"
            src="/logo.png"
            alt=""
            width={70}
            height={70}
          />
        </Link>
        <Menu />
      </div>

      <div className="hidden md:flex items-center justify-around gap-8 h-full">
        <div className="w-1/3 xl:w-1/2 flex items-center gap-12">
          <Link href="/" className="flex items-center gap-3">
            <Image
              className="rounded-full"
              src="/logo.png"
              alt=""
              width={70}
              height={70}
            />
          </Link>
          <div className="hidden xl:flex gap-4">
            <Link
              href="/contact"
              className="text-[20px] font-semibold georgian-text"
            >
              {t("contact")}
            </Link>
            <Link
              href="/list"
              className="text-[20px] font-semibold georgian-text"
            >
              {t("products")}
            </Link>
          </div>
        </div>

        <div className="w-2/3 flex justify-end items-center gap-4 xl:gap-8">
          <StoreSelector />
          <SearchBar />
          <NavIcons />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
