'use client';

import { useLocale } from 'next-intl';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';
import Image from 'next/image';

const languages = [
  {
    code: 'ka',
    label: 'ქართული',
    flag: '/Georgia.png',
  },
  {
    code: 'en',
    label: 'English',
    flag: '/America.png',
  },
];

const LanguageSwitcher = () => {
  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const localeActive = useLocale();

  const handleLocaleChange = (code: string) => {
    if (code === localeActive) return;
    startTransition(() => {
      const newPath = `/${code}${pathname.replace(/^\/[a-zA-Z]+/, '')}`;
      const query = searchParams?.toString();
      router.replace(`${newPath}${query ? `?${query}` : ''}`);
    });
  };

  const activeLang = languages.find(l => l.code === localeActive);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 shadow-lg border border-gray-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all backdrop-blur-md"
          aria-label="Select language"
        >
          <Globe className="w-5 h-5 text-gray-500" />
          <Image src={activeLang?.flag || ''} alt={activeLang?.label || ''} width={22} height={22} className="rounded-full border" />
          <span className="font-semibold text-gray-800 text-base">{activeLang?.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px] p-1 bg-white/95 shadow-2xl rounded-xl border border-gray-100">
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLocaleChange(lang.code)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-base font-medium ${localeActive === lang.code ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'}`}
            aria-current={localeActive === lang.code}
          >
            <Image src={lang.flag} alt={lang.label} width={20} height={20} className="rounded-full border" />
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;

