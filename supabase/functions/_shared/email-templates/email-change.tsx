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

interface EmailChangeEmailProps {
  siteName: string
  siteUrl?: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteUrl,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração do seu e-mail na Living Word</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>Living Word</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Confirmar alteração de e-mail</Heading>
          <Text style={text}>
            Recebemos uma solicitação para alterar o e-mail da sua conta Living Word de{' '}
            <Link href={`mailto:${email}`} style={link}>{email}</Link> para{' '}
            <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
          </Text>
          <Text style={text}>Clique no botão abaixo para confirmar esta alteração:</Text>
          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>
              Confirmar alteração
            </Button>
          </Section>
          <Text style={footer}>
            Se você não solicitou esta alteração, proteja sua conta imediatamente
            redefinindo sua senha.
          </Text>
        </Section>
        <Text style={brandFooter}>
          <Link href={siteUrl || 'https://livingwordgo.com'} style={brandFooterLink}>livingwordgo.com</Link> · Feito com ❤ por Living Word
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const header = { textAlign: 'center' as const, padding: '0 0 24px' }
const brand = { fontSize: '20px', fontWeight: 'bold' as const, color: '#6D28D9', margin: '0' }
const card = { backgroundColor: '#FAF7FF', border: '1px solid #E9DDFD', borderRadius: '16px', padding: '36px 32px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1F1235', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#4A3F5C', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#6D28D9', textDecoration: 'underline' }
const buttonWrap = { textAlign: 'center' as const, margin: '12px 0 20px' }
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
