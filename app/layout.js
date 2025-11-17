import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '../context/provider';
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Philippine National Election System',
  description: 'Voting system for UC Capstone Project',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}