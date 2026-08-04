import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export default function DashboardDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`shadcn-demo-scope ${geist.variable}`}>{children}</div>;
}
