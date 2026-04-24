import type { Metadata } from "next";
import { PatientProvider } from '../context/PatientContext';
import Navbar from '../components/layout/Navbar';
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
            <Navbar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </PatientProvider>
      </body>
    </html>
  );
}
