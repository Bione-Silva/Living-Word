/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { styles, SITE_URL, DASHBOARD_URL, SOCIAL } from './_shared-styles.ts'

interface Props { name?: string }

const WelcomeConfirmedEmail = ({ name }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Bem-vindo à Living Word — sua jornada pastoral começa agora</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brand}>Living Word</Text>
        </Section>
        <Section style={styles.card}>
          <Heading style={styles.h1}>
            {name ? `Bem-vindo, ${name}` : 'Bem-vindo à Living Word'}
          </Heading>
          <Text style={styles.text}>
            Que alegria ter você conosco. Sua conta está confirmada e a plataforma
            pastoral mais completa para líderes cristãos já está pronta para uso.
          </Text>
          <Text style={styles.text}>
            Em instantes, vamos preparar seu <strong>Altar Digital</strong> —
            seu blog próprio com três artigos bíblicos exclusivos para começar.
          </Text>
          <Section style={styles.buttonWrap}>
            <Button style={styles.button} href={DASHBOARD_URL}>
              Acessar meu painel
            </Button>
          </Section>
          <Text style={styles.verse}>
            "Pregue a Palavra, esteja preparado a tempo e fora de tempo." — 2 Timóteo 4:2
          </Text>
        </Section>
        <Section style={styles.socialRow}>
          <Link href={SOCIAL.instagram} style={styles.socialLink}>Instagram</Link>·
          <Link href={SOCIAL.youtube} style={styles.socialLink}>YouTube</Link>·
          <Link href={SOCIAL.facebook} style={styles.socialLink}>Facebook</Link>
        </Section>
        <Text style={styles.brandFooter}>
          <Link href={SITE_URL} style={styles.brandFooterLink}>livingwordgo.com</Link> · Feito com ❤ por Living Word
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeConfirmedEmail,
  subject: 'Bem-vindo à Living Word',
  displayName: 'Boas-vindas — conta confirmada',
  previewData: { name: 'Pastor João' },
} satisfies TemplateEntry
