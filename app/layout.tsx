import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { CommandPalette } from "@/components/layout/command-palette";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Brain Plug - Enterprise AI Agent Infrastructure",
  description:
    "Enterprise-grade AI Agent Infrastructure Platform with Multi-Tenant RBAC, RAG Knowledge Bases, and Embeddable Chat Widgets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={plusJakartaSans.variable}>
      <body className={`${plusJakartaSans.className} min-h-screen bg-background text-foreground antialiased selection:bg-purple-500/20 selection:text-purple-900 dark:selection:text-purple-200`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <CommandPalette />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
