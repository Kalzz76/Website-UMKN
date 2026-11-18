import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
});

export const metadata = {
  title: "Toko Kue Custom",
  description: "Website pemesanan kue custom UMKM",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
        />
      </head>
      <body className={`${plusJakartaSans.className} bg-amber-50 text-stone-800 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
