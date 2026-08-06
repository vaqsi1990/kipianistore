'use client';

import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { useTransition, useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Globe, Check } from 'lucide-react';

// Global dropdown state manager (same as in Dropdown.tsx)
let activeDropdown: string | null = null;
const dropdownListeners: Set<(id: string | null) => void> = new Set();

const closeAllDropdowns = (exceptId?: string) => {
  if (activeDropdown && activeDropdown !== exceptId) {
    activeDropdown = null;
    dropdownListeners.forEach(listener => listener(null));
  }
};

const setActiveDropdown = (id: string | null) => {
  activeDropdown = id;
  dropdownListeners.forEach(listener => listener(id));
};

export default function LocaleSwitcher({ onOpen }: { onOpen?: () => void }) {
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const localeActive = useLocale();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const dropdownId = 'locale-switcher';

  // Debug logging
  useEffect(() => {
 
  }, [localeActive, pathname, router]);

  // Listen for other dropdowns opening
  useEffect(() => {
    const handleDropdownChange = (id: string | null) => {
      if (id !== dropdownId && open) {
        setOpen(false);
      }
    };

    dropdownListeners.add(handleDropdownChange);
    return () => {
      dropdownListeners.delete(handleDropdownChange);
    };
  }, [open, dropdownId]);

  // Listen for global close events
  useEffect(() => {
    const handleGlobalClose = (event: CustomEvent) => {
      if (event.detail.exceptId !== dropdownId && open) {
        setOpen(false);
      }
    };

    window.addEventListener('closeAllDropdowns', handleGlobalClose as EventListener);
    return () => {
      window.removeEventListener('closeAllDropdowns', handleGlobalClose as EventListener);
    };
  }, [open, dropdownId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        listRef.current &&
        !(listRef.current as HTMLDivElement).contains(event.target as Node) &&
        buttonRef.current &&
        !(buttonRef.current as HTMLButtonElement).contains(event.target as Node)
      ) {
        setOpen(false);
        setActiveDropdown(null);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Keyboard accessibility
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setActiveDropdown(null);
      }
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleToggle = () => {
    const newOpenState = !open;
    setOpen(newOpenState);
    
    if (newOpenState) {
      // Close all other dropdowns and set this as active
      closeAllDropdowns(dropdownId);
      setActiveDropdown(dropdownId);
      // Trigger global event for custom dropdowns
      window.dispatchEvent(new CustomEvent('closeAllDropdowns', { detail: { exceptId: dropdownId } }));
      
      // Call the onOpen callback to close menu if provided
      if (onOpen) {
        onOpen();
      }
    } else {
      setActiveDropdown(null);
    }
  };

  const handleChange = (nextLocale: string) => {

    setOpen(false);
    setActiveDropdown(null);
    
    startTransition(() => {
      try {
        // Get current search parameters
        const searchParams = window.location.search;
        const fullPath = pathname + searchParams;
        
        // Try next-intl router first with full path including search params
        router.replace(fullPath, { locale: nextLocale });
      
      } catch (error) {
        console.error('next-intl router failed:', error);
        // Fallback to manual navigation with search params
        const currentPath = pathname.replace(/^\/[a-zA-Z]+/, '');
        const searchParams = window.location.search;
        const newPath = `/${nextLocale}${currentPath}${searchParams}`;

        window.location.href = newPath;
      }
    });
  };

  const locales = [
    { code: 'en', label: 'English', flag: '/America.png' },
    { code: 'ka', label: 'ქართული', flag: '/Georgia.png' },
  ];

  const currentLocale = locales.find(l => l.code === localeActive);

  return (
    <div className="relative inline-block h-[40px] text-left">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 h-[40px] px-4 w-[160px] py-2 border rounded-full bg-white/70 backdrop-blur-md border-gray-200 text-black font-semibold transition-all focus:ring-2 focus:ring-primary/40 hover:bg-white"
      >
        <Globe className="w-5 h-5 text-gray-500" />
        <div className="w-5 h-5 flex-shrink-0">
          <Image 
            src={currentLocale?.flag || "/America.png"} 
            alt="flag" 
            width={20} 
            height={20} 
            className="rounded-full w-full h-full object-cover border" 
          />
        </div>
        <span className="text-base font-medium">{currentLocale?.label}</span>
      </button>

      {/* Dropdown */}
      <div
        ref={listRef}
        className={`absolute z-20 -right-3 mt-2 w-[180px] rounded-xl border border-gray-100 shadow-2xl bg-white/90 backdrop-blur-xl transition-all duration-200 ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
        style={{ minWidth: 160 }}
        tabIndex={-1}
        role="listbox"
        aria-activedescendant={currentLocale?.code}
      >
        {locales.map(locale => (
          <button
            key={locale.code}
            onClick={() => handleChange(locale.code)}
            className={`flex items-center gap-2 w-full px-4 py-2 rounded-lg text-base font-medium transition-all cursor-pointer focus:outline-none focus:bg-primary/10 hover:bg-gray-100 ${currentLocale?.code === locale.code ? 'bg-gray-50' : ''}`}
            role="option"
            aria-selected={currentLocale?.code === locale.code}
          >
            <Image 
              src={locale.flag} 
              alt={`${locale.label} flag`} 
              width={20} 
              height={20} 
              className="rounded-full w-5 h-5 object-cover border" 
            />
            <span>{locale.label}</span>
            {currentLocale?.code === locale.code && <Check className="w-4 h-4 text-black ml-auto" />}
          </button>
        ))}
      </div>
    </div>
  );
}