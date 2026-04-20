/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { styles, SITE_URL, SOCIAL } from './_shared-styles.ts'

interface Props { name?: string }

const DripDay7Email = ({ name }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Sua primeira semana com a Living Word — o que vem agora</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brand}>Living Word</Text>
        </Section>
        <Section style={styles.card}>
          <Heading style={styles.h1}>
            {name ? `${name}, sua primeira semana foi só o começo` : 'Sua primeira semana foi só o começo'}
          </Heading>
          <Text style={styles.text}>
            Em sete dias você já pode ter um <strong>Altar Digital ativo</strong>, sermões
            estruturados e estudos bíblicos prontos para sua igreja. Que tal manter o ritmo?
          </Text>
          <Text style={styles.text}>
            <strong>Sugestão para esta semana:</strong> publique mais um artigo no seu blog
            usando a IA. Conteúdo recorrente fortalece autoridade pastoral e alcança
            quem precisa ouvir.
          </Text>
          <Section style={styles.buttonWrap}>
            <Button style={styles.button} href={`${SITE_URL}/blog`}>
              Criar próximo artigo
            </Button>
          </Section>
          <Text style={styles.verse}>
            "Não nos cansemos de fazer o bem, pois no tempo próprio colheremos." — Gálatas 6:9
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
  component: DripDay7Email,
  subject: 'Sua primeira semana — o que vem agora',
  displayName: 'Drip — Dia 7',
  previewData: { name: 'Pastor João' },
} satisfies TemplateEntry
