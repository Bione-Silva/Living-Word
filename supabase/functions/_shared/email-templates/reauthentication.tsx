/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { AUTH_REAUTH, FOOTER_BRAND, htmlLang, normalizeLang } from '../transactional-email-templates/_i18n.ts'

interface ReauthenticationEmailProps {
  token: string
  siteUrl?: string
  lang?: string
}

export const ReauthenticationEmail = ({ token, siteUrl, lang }: ReauthenticationEmailProps) => {
  const L = normalizeLang(lang)
  const t = AUTH_REAUTH[L]
  return (
    <Html lang={htmlLang(L)} dir="ltr">
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>Living Word</Text>
          </Section>
          <Section style={card}>
            <Heading style={h1}>{t.h1}</Heading>
            <Text style={text}>{t.text}</Text>
            <Text style={codeStyle}>{token}</Text>
            <Text style={footer}>{t.footer}</Text>
          </Section>
          <Text style={brandFooter}>
            <Link href={siteUrl || 'https://livingwordgo.com'} style={brandFooterLink}>livingwordgo.com</Link> · {FOOTER_BRAND[L]}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const header = { textAlign: 'center' as const, padding: '0 0 24px' }
const brand = { fontSize: '20px', fontWeight: 'bold' as const, color: '#6D28D9', margin: '0' }
const card = { backgroundColor: '#FAF7FF', border: '1px solid #E9DDFD', borderRadius: '16px', padding: '36px 32px', textAlign: 'center' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1F1235', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#4A3F5C', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#6D28D9',
  letterSpacing: '0.2em',
  backgroundColor: '#ffffff',
  border: '2px solid #E9DDFD',
  borderRadius: '12px',
  padding: '20px',
  margin: '0 0 24px',
}
const footer = { fontSize: '12px', color: '#998AAE', margin: '20px 0 0', lineHeight: '1.5' }
const brandFooter = { fontSize: '11px', color: '#998AAE', textAlign: 'center' as const, margin: '24px 0 0' }
const brandFooterLink = { color: '#6D28D9', textDecoration: 'none' }
