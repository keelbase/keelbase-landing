import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'Keelbase | Build an AI-native company in a conversation',
  description: 'Keelbase is the platform for deploying an AI-native companies. Describe your idea. Your crew, governance, and payments are configured in a single conversation.',
  keywords: 'AI-native company, AI company builder, build a company with AI, no-code AI company, autonomous business platform, founder tools',
  metadataBase: new URL('https://www.keelbase.io'),
  openGraph: {
    type: 'website',
    url: 'https://www.keelbase.io/',
    title: 'Keelbase — Build an AI-native company in a conversation',
    description: "Your business idea doesn't need a team. It needs a Vessel.",
    siteName: 'Keelbase',
    images: [{ url: '/og-image.png?v=3', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@keelbase',
    title: 'Keelbase | Build an AI-native company in a conversation',
    description: "Your business idea doesn't need a team. It needs a Vessel.",
    images: ['/og-image.png?v=3'],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
          {
            "@context": "https://schema.org", "@type": "Organization",
            "name": "Keelbase", "url": "https://www.keelbase.io",
            "logo": "https://www.keelbase.io/logo.png",
            "description": "Keelbase is the platform for deploying an AI-native company.",
            "sameAs": ["https://twitter.com/keelbase"]
          },
          {
            "@context": "https://schema.org", "@type": "SoftwareApplication",
            "name": "Keelbase", "applicationCategory": "BusinessApplication", "operatingSystem": "Web",
            "description": "Keelbase deploys self-operating AI-native companies called Vessels.",
            "offers": { "@type": "Offer", "availability": "https://schema.org/PreOrder" }
          },
          {
            "@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [
              { "@type": "Question", "name": "What is Keelbase?", "acceptedAnswer": { "@type": "Answer", "text": "Keelbase is the platform for deploying an AI-native companies. A founder describes their idea in a single conversation, and Keelbase deploys a Vessel — a complete, self-operating business with its own crew, governance, and payments." } },
              { "@type": "Question", "name": "What is a Vessel?", "acceptedAnswer": { "@type": "Answer", "text": "A Vessel is a Keelbase-deployed company that runs itself. The founder sets the direction and makes decisions; the Vessel handles the operations." } },
              { "@type": "Question", "name": "Do I need to be technical to use Keelbase?", "acceptedAnswer": { "@type": "Answer", "text": "No. Setup happens through a plain-language conversation with the Architect. If you can describe your business idea, you can launch a Vessel." } },
              { "@type": "Question", "name": "How do I get access?", "acceptedAnswer": { "@type": "Answer", "text": "Join the waitlist at keelbase.io. The first cohort is small. The Architect will reach out when your cohort opens." } }
            ]
          }
        ]) }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
