import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Pocket Atlas · Save places from AMap",description:"Personal China travel maps with custom pins, notes, and AMap imports."};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {return <html lang="en"><body>{children}</body></html>}
