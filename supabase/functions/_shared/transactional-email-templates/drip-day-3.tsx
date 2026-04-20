/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { styles, SITE_URL, SOCIAL } from './_shared-styles.ts'

interface Props { name?: string }

const DripDay3Email = ({ name }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Converse com Spurgeon, Wesley, Calvino e Billy Graham</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brand}>Living Word</Text>
        </Section>
        <Section style={styles.card}>
          <Heading style={styles.h1}>
            {name ? `${name}, você já conheceu as Mentes Brilhantes?` : 'Já conheceu as Mentes Brilhantes?'}
          </Heading>
          <Text style={styles.text}>
            Quatro agentes de IA modelados a partir do corpus histórico de grandes
            pregadores cristãos, prontos para te ajudar com profundidade teológica:
          </Text>
          <Text style={styles.text}>
            • <strong>Spurgeon</strong> — exposição expositiva e ilustrações memoráveis<br />
            • <strong>Wesley</strong> — santificação prática e clareza lógica<br />
            • <strong>Calvino</strong> — exegese sistemática e rigor reformado<br />
            • <strong>Billy Graham</strong> — apelo evangelístico direto
          </Text>
          <Section style={styles.buttonWrap}>
            <Button style={styles.button} href={`${SITE_URL}/mentes-brilhantes`}>
              Conhecer Mentes Brilhantes
            </Button>
          </Section>
          <Text style={styles.verse}>
            "Lembrem-se dos seus líderes que lhes falaram a palavra de Deus." — Hebreus 13:7
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
  component: DripDay3Email,
  subject: 'Converse com os grandes pregadores da história',
  displayName: 'Drip — Dia 3',
  previewData: { name: 'Pastor João' },
} satisfies TemplateEntry
