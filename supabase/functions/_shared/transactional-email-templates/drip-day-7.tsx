/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { styles, SITE_URL, SOCIAL } from './_shared-styles.ts'
import { DRIP_DAY_7, FOOTER_BRAND, htmlLang, normalizeLang, type Lang } from './_i18n.ts'

interface Props { name?: string; lang?: Lang | string }

const DripDay7Email = ({ name, lang }: Props) => {
  const L = normalizeLang(lang as string)
  const t = DRIP_DAY_7[L]
  return (
    <Html lang={htmlLang(L)} dir="ltr">
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.brand}>Living Word</Text>
          </Section>
          <Section style={styles.card}>
            <Heading style={styles.h1}>
              {name ? t.h1WithName(name) : t.h1NoName}
            </Heading>
            <Text style={styles.text}>
              {t.p1Prefix}<strong>{t.p1Strong}</strong>{t.p1Suffix}
            </Text>
            <Text style={styles.text}>
              <strong>{t.p2Strong}</strong>{t.p2}
            </Text>
            <Section style={styles.buttonWrap}>
              <Button style={styles.button} href={`${SITE_URL}/blog`}>{t.cta}</Button>
            </Section>
            <Text style={styles.verse}>{t.verse}</Text>
          </Section>
          <Section style={styles.socialRow}>
            <Link href={SOCIAL.instagram} style={styles.socialLink}>Instagram</Link>·
            <Link href={SOCIAL.youtube} style={styles.socialLink}>YouTube</Link>·
            <Link href={SOCIAL.facebook} style={styles.socialLink}>Facebook</Link>
          </Section>
          <Text style={styles.brandFooter}>
            <Link href={SITE_URL} style={styles.brandFooterLink}>livingwordgo.com</Link> · {FOOTER_BRAND[L]}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: DripDay7Email,
  subject: (data: Record<string, any>) => DRIP_DAY_7[normalizeLang(data?.lang)].subject,
  displayName: 'Drip — Dia 7',
  previewData: { name: 'Pastor João', lang: 'PT' },
} satisfies TemplateEntry
