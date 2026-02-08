import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./prism.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AppContextProvider } from "@/context/AppContext"
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "DeepSeek",
  description: "Your Talking Buddy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    <ClerkProvider>
      <AppContextProvider>
        <html lang="en">
          <body
            className={`${inter.className}  antialiased`}
          >
            <Toaster toastOptions={
              {
                success: {style: {background: "black", color: "white"}},
                error: {style: {background: "black", color: "white"}}
              }
            } />
            {children}
          </body>
        </html>
      </AppContextProvider>
    </ClerkProvider>
  );
}
