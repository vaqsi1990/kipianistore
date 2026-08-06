'use client';

import { useLocale } from 'next-intl';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useTransition } from 'react';

const LanguageSwitcher = () => {
  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const localeActive = useLocale();

  const toggleLocale = () => {
    const nextLocale = localeActive === 'en' ? 'ka' : 'en';
    startTransition(() => {
      const newPath = `/${nextLocale}${pathname.replace(/^\/[a-zA-Z]+/, '')}`;
      const query = searchParams?.toString();
      router.replace(`${newPath}${query ? `?${query}` : ''}`);
    });
  };


  return (
    <button
      onClick={toggleLocale}
      className="font-medium text-black bg-[#e6dfd9] py-2 px-4 rounded focus:outline-none"
    >
      {localeActive === 'en' ? 'ქართული | English' : 'ქართული | English'}
    </button>
  );
};

export default LanguageSwitcher;

