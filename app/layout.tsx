import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Arré Unposted',
  description: 'Your private voice journal',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-P5GVXHFWC1" strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-P5GVXHFWC1');
      ` }} />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}>
        <div className="mx-auto w-full max-w-[480px] md:max-w-none min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
