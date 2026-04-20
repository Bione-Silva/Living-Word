/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as welcomeConfirmed } from './welcome-confirmed.tsx'
import { template as altarDigitalReady } from './altar-digital-ready.tsx'
import { template as dripDay1 } from './drip-day-1.tsx'
import { template as dripDay3 } from './drip-day-3.tsx'
import { template as dripDay7 } from './drip-day-7.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome-confirmed': welcomeConfirmed,
  'altar-digital-ready': altarDigitalReady,
  'drip-day-1': dripDay1,
  'drip-day-3': dripDay3,
  'drip-day-7': dripDay7,
}
