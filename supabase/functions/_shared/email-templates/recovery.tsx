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

interface RecoveryEmailProps {
  siteName: string
  siteUrl?: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteUrl, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefina sua senha da Living Word</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>Living Word</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Vamos cuidar disso juntos 🙏</Heading>
          <Text style={text}>
            Recebemos seu pedido para redefinir a senha do seu Altar Digital.
            Acontece com todos nós — clique no botão abaixo e em poucos segundos
            você estará de volta criando conteúdo pastoral com a Living Word.
          </Text>
          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>
              Criar nova senha
            </Button>
          </Section>
          <Text style={smallText}>Este link é válido por 1 hora — por sua segurança.</Text>
          <Text style={footer}>
            Se você não pediu para redefinir sua senha, fique tranquilo:
            basta ignorar este e-mail e sua conta continuará protegida.
          </Text>
        </Section>
        <Text style={brandFooter}>
          <Link href={siteUrl || 'https://livingwordgo.com'} style={brandFooterLink}>livingwordgo.com</Link> · Feito com ❤ por Living Word
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const header = { textAlign: 'center' as const, padding: '0 0 24px' }
const brand = { fontSize: '20px', fontWeight: 'bold' as const, color: '#6D28D9', margin: '0' }
const card = { backgroundColor: '#FAF7FF', border: '1px solid #E9DDFD', borderRadius: '16px', padding: '36px 32px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1F1235', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#4A3F5C', lineHeight: '1.6', margin: '0 0 24px' }
const smallText = { fontSize: '13px', color: '#6B5C7E', lineHeight: '1.5', margin: '0 0 20px', textAlign: 'center' as const }
const buttonWrap = { textAlign: 'center' as const, margin: '8px 0 20px' }
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
const footer = { fontSize: '12px', color: '#998AAE', margin: '20px 0 0', lineHeight: '1.5' }
const brandFooter = { fontSize: '11px', color: '#998AAE', textAlign: 'center' as const, margin: '24px 0 0' }
const brandFooterLink = { color: '#6D28D9', textDecoration: 'none' }
