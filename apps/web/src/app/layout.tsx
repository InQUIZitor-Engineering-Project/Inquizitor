import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StyledComponentsRegistry } from "@/lib/styled-components-registry";
import { Providers } from "@/components/providers/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    template: "%s | Inquizitor",
    default: "Inquizitor – nauka przez quizy",
  },
  description:
    "Inteligentna platforma do tworzenia quizów z treści książek i dokumentów.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://inquizitor.pl"
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className={inter.variable}>
      <body>
        <StyledComponentsRegistry>
          <Providers>{children}</Providers>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
