/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { styles, SITE_URL, SOCIAL } from './_shared-styles.ts'

interface Props { name?: string }

const DripDay1Email = ({ name }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Crie seu próximo sermão em minutos com a IA pastoral</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brand}>Living Word</Text>
        </Section>
        <Section style={styles.card}>
          <Heading style={styles.h1}>
            {name ? `${name}, vamos criar seu próximo sermão?` : 'Vamos criar seu próximo sermão?'}
          </Heading>
          <Text style={styles.text}>
            A Living Word foi treinada nas Escrituras e em corpus de grandes pregadores
            (Spurgeon, Wesley, Calvino, Billy Graham). Em poucos minutos você pode:
          </Text>
          <Text style={styles.text}>
            • Esboçar um sermão expositivo a partir de uma passagem<br />
            • Gerar ilustrações fiéis ao contexto bíblico<br />
            • Adaptar tom para igreja local, juventude ou estudo de grupo
          </Text>
          <Section style={styles.buttonWrap}>
            <Button style={styles.button} href={`${SITE_URL}/pulpito`}>
              Abrir o Púlpito
            </Button>
          </Section>
          <Text style={styles.verse}>
            "Toda a Escritura é inspirada por Deus e útil para o ensino." — 2 Timóteo 3:16
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
  component: DripDay1Email,
  subject: 'Crie seu próximo sermão em minutos',
  displayName: 'Drip — Dia 1',
  previewData: { name: 'Pastor João' },
} satisfies TemplateEntry
