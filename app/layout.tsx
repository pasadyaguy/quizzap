import type { Metadata } from "next";
export const metadata: Metadata = { title: "QuizZap", description: "Live multiplayer trivia" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#08080f" }}>{children}</body>
    </html>
  );
}
