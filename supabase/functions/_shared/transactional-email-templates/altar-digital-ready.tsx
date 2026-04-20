/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { styles, SITE_URL, DASHBOARD_URL, SOCIAL } from './_shared-styles.ts'

interface Props { name?: string; blogUrl?: string }

const AltarDigitalEmail = ({ name, blogUrl }: Props) => {
  const finalBlogUrl = blogUrl || SITE_URL
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Seu Altar Digital está no ar — 3 artigos bíblicos prontos</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.brand}>Living Word</Text>
          </Section>
          <Section style={styles.card}>
            <Heading style={styles.h1}>
              {name ? `${name}, seu Altar Digital está no ar` : 'Seu Altar Digital está no ar'}
            </Heading>
            <Text style={styles.text}>
              Já provisionamos seu blog com <strong>3 artigos bíblicos exclusivos</strong> para
              que você comece a edificar sua audiência hoje mesmo.
            </Text>
            <Text style={styles.text}>
              Cada artigo foi cuidadosamente preparado para refletir profundidade pastoral,
              fidelidade às Escrituras e clareza para leitores em busca de Cristo.
            </Text>
            <Section style={styles.buttonWrap}>
              <Button style={styles.button} href={finalBlogUrl}>
                Ver meu blog
              </Button>
            </Section>
            <Text style={{ ...styles.text, textAlign: 'center' as const, fontSize: '13px' }}>
              <Link href={DASHBOARD_URL} style={styles.brandFooterLink}>
                Acessar meu painel
              </Link>
            </Text>
            <Text style={styles.verse}>
              "Pastoreiem o rebanho de Deus que está aos seus cuidados." — 1 Pedro 5:2
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
}

export const template = {
  component: AltarDigitalEmail,
  subject: 'Seu Altar Digital está no ar 🎉',
  displayName: 'Altar Digital pronto',
  previewData: { name: 'Pastor João', blogUrl: 'https://joao.livingwordgo.com' },
} satisfies TemplateEntry
