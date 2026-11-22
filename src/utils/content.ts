/** A placeholder is a value wrapped in square brackets, e.g. "[Add LinkedIn URL]". */
export const isPlaceholder = (value: string): boolean => /^\[[^\]]*\]$/.test(value.trim())

/** True when a value is present and is not a placeholder. */
export const isConfigured = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim() !== '' && !isPlaceholder(value)

export const isExternalUrl = (href: string): boolean => /^(https?:)?\/\//.test(href) || href.startsWith('mailto:')

/** Strips the brackets for display inside UI that already marks the value as missing. */
export const placeholderText = (value: string): string => value.trim().replace(/^\[|\]$/g, '')
