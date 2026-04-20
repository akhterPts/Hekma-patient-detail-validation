import type { Metadata } from "next";
import { PatientProvider } from '../context/PatientContext';
import Image from 'next/image';
import "./globals.css";

export const metadata: Metadata = {
  title: 'Hekma Validation',
  description: 'Clinical Trial Patient Detail Validation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PatientProvider>
          <div className="app-container">
            <header className="top-nav">
              <div className="logo-container">
                <a href="/patients">
                  <Image 
                    src="/Images/logo.svg" 
                    alt="Hekma Logo" 
                    width={160} 
                    height={50} 
                    priority
                  />
                </a>
              </div>
            </header>
            <main className="main-content">
              {children}
            </main>
          </div>
        </PatientProvider>
      </body>
    </html>
  );
}
