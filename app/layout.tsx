import type { Metadata, Viewport } from "next"; import "./globals.css";
export const metadata:Metadata={title:"Project Vault",description:"A calm space to organize all your projects.",manifest:"/manifest.webmanifest",applicationName:"Project Vault"};
export const viewport:Viewport={themeColor:"#F4EFE8",width:"device-width",initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="th"><body>{children}</body></html>}