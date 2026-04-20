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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail para acessar a Living Word</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>Living Word</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Bem-vindo à Living Word</Heading>
          <Text style={text}>
            Que alegria ter você aqui. Para começar a usar sua plataforma bíblica
            inteligente, confirme seu e-mail clicando no botão abaixo.
          </Text>
          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>
              Confirmar e-mail
            </Button>
          </Section>
          <Text style={smallText}>
            Conta criada para{' '}
            <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>.
          </Text>
          <Text style={verse}>
            "A tua palavra é lâmpada para os meus pés e luz para o meu caminho." — Salmos 119:105
          </Text>
          <Text style={footer}>
            Se você não criou esta conta, pode ignorar este e-mail com segurança.
          </Text>
        </Section>
        <Text style={brandFooter}>
          <Link href={siteUrl} style={brandFooterLink}>livingwordgo.com</Link> · Feito com ❤ por Living Word
        </Text>
      </Container>
    </Body>
  </Html>
)

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
