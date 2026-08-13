import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ConfirmHost } from "@/lib/confirm";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GOxT CRM",
    template: "%s | GOxT CRM",
  },
  description: "CRM de GOxT — gestiona contactos, oportunidades y operaciones desde un solo lugar.",
  icons: {
    icon: "/images/isotipo_negro.png",
  },
  // La app vive detrás de login — no hay nada público que indexar. El SEO real
  // (marketing, contenido, blog) vive en goxt-website-principal, no acá.
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SessionProvider>{children}</SessionProvider>
          <Toaster position="bottom-right" richColors duration={6000} closeButton />
          <ConfirmHost />
        </ThemeProvider>
      </body>
    </html>
  );
}
