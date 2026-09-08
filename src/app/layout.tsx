import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/CartContext";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { ToastNotification } from "@/components/storefront/ToastNotification";
import { SizeGuideModal } from "@/components/storefront/SizeGuideModal";

export const metadata: Metadata = {
  title: {
    default: "STYLUXE | Official Luxury Fashion Store",
    template: "%s | STYLUXE Luxury",
  },
  description: "Lebanon's premier luxury fashion boutique. Curated authentic designer apparel, footwear, and accessories from global fashion houses including Prada, Gucci, Amiri, Off-White, and Dior.",
  keywords: ["Luxury Fashion", "Prada Lebanon", "Gucci Beirut", "Amiri", "Designer Footwear", "Luxury Ready to Wear", "STYLUXE Boutique"],
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
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var v = localStorage.getItem('styluxe_app_version');
                  if (v !== 'v5.0_clean_database_sync') {
                    localStorage.clear();
                    localStorage.setItem('styluxe_app_version', 'v5.0_clean_database_sync');
                    localStorage.setItem('styluxe_products_v1', '[]');
                    localStorage.setItem('styluxe_categories_v1', '[]');
                    localStorage.setItem('styluxe_cards_v1', '[]');
                  }
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      for (var name of names) caches.delete(name);
                    });
                  }
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(regs) {
                      for (var r of regs) r.unregister();
                    });
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-white text-zinc-950 min-h-screen flex flex-col antialiased">
        <CartProvider>
          <Header />
          <CartDrawer />
          <ToastNotification />
          <SizeGuideModal />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
