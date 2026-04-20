// Shared inline styles for Living Word transactional emails
export const SITE_NAME = 'Living Word'
export const SITE_URL = 'https://livingwordgo.com'
export const DASHBOARD_URL = 'https://livingwordgo.com/dashboard'

// Social placeholders — atualizar com URLs reais quando disponíveis
export const SOCIAL = {
  instagram: 'https://instagram.com/livingwordgo',
  youtube: 'https://youtube.com/@livingwordgo',
  facebook: 'https://facebook.com/livingwordgo',
}

export const styles = {
  main: {
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  },
  container: { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' },
  header: { textAlign: 'center' as const, padding: '0 0 24px' },
  brand: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    color: '#6D28D9',
    letterSpacing: '-0.01em',
    margin: '0',
  },
  card: {
    backgroundColor: '#FAF7FF',
    border: '1px solid #E9DDFD',
    borderRadius: '16px',
    padding: '36px 32px',
  },
  h1: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: '#1F1235',
    margin: '0 0 16px',
    lineHeight: '1.3',
  },
  text: {
    fontSize: '15px',
    color: '#4A3F5C',
    lineHeight: '1.65',
    margin: '0 0 18px',
  },
  buttonWrap: { textAlign: 'center' as const, margin: '24px 0 20px' },
  button: {
    backgroundColor: '#6D28D9',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 'bold' as const,
    borderRadius: '12px',
    padding: '14px 32px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  verse: {
    fontSize: '13px',
    fontStyle: 'italic' as const,
    color: '#6D28D9',
    borderLeft: '3px solid #C4B5FD',
    paddingLeft: '14px',
    margin: '24px 0 8px',
    lineHeight: '1.5',
  },
  divider: {
    borderTop: '1px solid #E9DDFD',
    margin: '24px 0 16px',
  },
  socialRow: {
    textAlign: 'center' as const,
    margin: '20px 0 8px',
  },
  socialLink: {
    color: '#6D28D9',
    textDecoration: 'none',
    fontSize: '13px',
    margin: '0 8px',
  },
  brandFooter: {
    fontSize: '11px',
    color: '#998AAE',
    textAlign: 'center' as const,
    margin: '12px 0 0',
    lineHeight: '1.6',
  },
  brandFooterLink: { color: '#6D28D9', textDecoration: 'none' },
}
