import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "STYLUXE | Admin Control Panel & POS Terminal",
  description: "Styluxe Luxury Store Admin Panel",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      {children}
    </div>
  );
}
