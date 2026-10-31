import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/lib/CartContext";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { ToastNotification } from "@/components/storefront/ToastNotification";
import { SizeGuideModal } from "@/components/storefront/SizeGuideModal";
import { FloatingActions } from "@/components/storefront/FloatingActions";
import { VisitorTracker } from "@/components/storefront/VisitorTracker";
import { PixelTracker } from "@/components/storefront/PixelTracker";
import { VideoIntroSplash } from "@/components/storefront/VideoIntroSplash";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: {
    default: "STYLUXE | Official Luxury Fashion Store",
    template: "%s | STYLUXE Luxury",
  },
  description: "Lebanon's premier luxury fashion boutique. Curated authentic designer apparel, footwear, and accessories from global fashion houses including Prada, Gucci, Amiri, Off-White, and Dior.",
  keywords: ["Luxury Fashion", "Prada Lebanon", "Gucci", "Amiri", "Designer Footwear", "Luxury Ready to Wear", "STYLUXE Boutique"],
  authors: [{ name: "STYLUXE Boutique" }],
  creator: "STYLUXE",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://styluxelb.com",
    siteName: "STYLUXE Boutique",
    title: "STYLUXE | Official Luxury Fashion Store",
    description: "Curated authentic designer apparel, footwear, and accessories with express white-glove delivery across Lebanon.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&auto=format&fit=crop&q=85",
        width: 1200,
        height: 630,
        alt: "STYLUXE Luxury Fashion Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "STYLUXE | Official Luxury Fashion Store",
    description: "Curated authentic designer apparel, footwear, and accessories.",
    images: ["https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&auto=format&fit=crop&q=85"],
  },
  icons: {
    icon: [
      { url: '/logo.jpg?v=2', type: 'image/jpeg' },
      { url: '/favicon.ico?v=2' },
    ],
    shortcut: ['/logo.jpg?v=2'],
    apple: [
      { url: '/logo.jpg?v=2', sizes: '180x180', type: 'image/jpeg' },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/jpeg" href="/logo.jpg?v=2" />
        <link rel="shortcut icon" href="/logo.jpg?v=2" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Meta (Facebook & Instagram) Pixel Code */}
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1644089083922873');
              fbq('track', 'PageView');
              window._fbqLoadedFromLayout = true;
            `,
          }}
        />
      </head>
      <body className="bg-white text-zinc-950 min-h-screen flex flex-col antialiased">
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1644089083922873&ev=PageView&noscript=1"
            alt="facebook pixel"
          />
        </noscript>
        <CartProvider>
          <VideoIntroSplash />
          <VisitorTracker />
          <PixelTracker />
          <Header />
          <CartDrawer />
          <ToastNotification />
          <SizeGuideModal />
          <FloatingActions />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
