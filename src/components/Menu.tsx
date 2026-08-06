"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import LocaleSwitcher from "./switcher";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import LanguageSwitcher from "./LanguageSwitcher";
import CartIcon from "./CartIcon";

const Menu = () => {
  const [open, setOpen] = useState(false);
  const t = useTranslations("navitems");
  const { data: session } = useSession();
  const handleClose = () => setOpen(false);


  // Callback to close menu when language switcher opens
  const handleLanguageSwitcherOpen = () => {
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <CartIcon />
      <Image
        src="/menu.png"
        alt=""
        width={28}
        height={28}
        className="cursor-pointer"
        onClick={() => setOpen((prev) => !prev)}
      />
      <div className="">
        {open && (
          <div className="absolute bg-[#FAF3E0] text-black left-0 w-full h-[calc(100vh-80px)] flex flex-col items-center justify-start gap-8 text-xl z-[50] top-20">
            <div className="mt-[20px] text-[18px] bg-[#e6dfd9] font-semibold flex flex-col items-center gap-8 georgian-text">
              <Link href="/contact" onClick={handleClose}> {t('contact')} </Link>
              <Link href="/list" onClick={handleClose}> {t('products')} </Link>
              {session ? (
                <Link href="/profile" onClick={handleClose}>
                  {t('profile')}
                </Link>
              ) : (
                <Link href="/sign-in" onClick={handleClose}>
                  {t('login')}
                </Link>
              )}
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </div>
    </div>
  );

};

export default Menu;
