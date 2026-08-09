import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VerseFlow — Projection de versets bibliques",
  description:
    "VerseFlow permet de projeter des versets bibliques sur une vidéo en direct, comme ProPresenter, directement depuis votre navigateur.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="font-sans">{children}</body>
    </html>
  );
}
