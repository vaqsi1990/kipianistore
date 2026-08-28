import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { NextIntlClientProvider } from "next-intl"; 
const inter = Josefin_Sans({ subsets: ["latin"] });
import { SessionProvider } from "next-auth/react";
import { auth } from "../../../auth";
import { getMessages } from "next-intl/server";
import { Toaster } from 'sonner';
import { CartProvider } from "@/lib/context/CartContext";
import SideLogo from "@/components/SideLogo";


export const metadata: Metadata = {
  title: "Kipiani Store",
  description:
    "Kipiani Store — premium furniture and sleep products in Georgia. Shops in Batumi, Kobuleti, Kutaisi, and Tbilisi.",
  other: {
    "preload-images": "true",
  },
};

// Generate static params for all locales
export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ka' }];
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: 'ka' | 'en' };
}>) {
  const session = await auth();
  const messages = await getMessages();
  
  return (
    <html lang={params.locale} data-locale={params.locale}>
      <head>
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/logo.png" />
        {/* Preload critical images for better performance */}
        <link rel="preload" as="image" href="/slider/1.jpg" />
        <link rel="preload" as="image" href="/slider/2.jpg" />
        <link rel="preload" as="image" href="/slider/3.jpg" />
        <link rel="dns-prefetch" href="//res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
      </head>
      <body className={inter.className}>  
        <SessionProvider session={session}>
          <NextIntlClientProvider messages={messages}>
            <CartProvider>
              {/* <Navbar /> */}
              {children}
              <SideLogo />
              <Footer />
            
              <Toaster 
                position="top-right"
                duration={3000}
                closeButton={true}
                richColors={true}
              />
            </CartProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}