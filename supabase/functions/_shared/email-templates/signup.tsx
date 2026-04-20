/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { AUTH_SIGNUP, FOOTER_BRAND, htmlLang, normalizeLang } from '../transactional-email-templates/_i18n.ts'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  lang?: string
}

export const SignupEmail = ({
  siteUrl,
  recipient,
  confirmationUrl,
  lang,
}: SignupEmailProps) => {
  const L = normalizeLang(lang)
  const t = AUTH_SIGNUP[L]
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
            <Section style={buttonWrap}>
              <Button style={button} href={confirmationUrl}>{t.cta}</Button>
            </Section>
            <Text style={smallText}>
              {t.accountFor}{' '}
              <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>.
            </Text>
            <Text style={verse}>{t.verse}</Text>
            <Text style={footer}>{t.ignore}</Text>
          </Section>
          <Text style={brandFooter}>
            <Link href={siteUrl} style={brandFooterLink}>livingwordgo.com</Link> · {FOOTER_BRAND[L]}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const header = { textAlign: 'center' as const, padding: '0 0 24px' }
const brand = { fontSize: '20px', fontWeight: 'bold' as const, color: '#6D28D9', letterSpacing: '-0.01em', margin: '0' }
const card = { backgroundColor: '#FAF7FF', border: '1px solid #E9DDFD', borderRadius: '16px', padding: '36px 32px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1F1235', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#4A3F5C', lineHeight: '1.6', margin: '0 0 24px' }
const smallText = { fontSize: '13px', color: '#6B5C7E', lineHeight: '1.5', margin: '0 0 20px' }
const link = { color: '#6D28D9', textDecoration: 'underline' }
const buttonWrap = { textAlign: 'center' as const, margin: '8px 0 28px' }
const button = {
  backgroundColor: '#6D28D9',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}
const verse = {
  fontSize: '13px',
  fontStyle: 'italic' as const,
  color: '#6D28D9',
  borderLeft: '3px solid #C4B5FD',
  paddingLeft: '14px',
  margin: '24px 0 20px',
  lineHeight: '1.5',
}
const footer = { fontSize: '12px', color: '#998AAE', margin: '20px 0 0', lineHeight: '1.5' }
const brandFooter = { fontSize: '11px', color: '#998AAE', textAlign: 'center' as const, margin: '24px 0 0' }
const brandFooterLink = { color: '#6D28D9', textDecoration: 'none' }
