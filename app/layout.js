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
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel+Decorative:wght@700&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Dancing+Script:wght@600;700&family=Great+Vibes&family=Pinyon+Script&family=Quicksand:wght@500;600;700&family=Caveat:wght@600;700&family=Satisfy&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${plusJakartaSans.className} bg-amber-50 text-stone-800 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
