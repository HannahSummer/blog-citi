export type FrontMatterValue = string | boolean
export type FrontMatter = Record<string, FrontMatterValue>

export function parseFrontMatter(raw: string): { metadata: FrontMatter; content: string } {
  raw = raw.replace(/^\uFEFF/, '')
  const match = raw.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/)
  if (!match) return { metadata: {}, content: raw }
  const metadata = Object.fromEntries(match[1].split('\n').flatMap((line) => {
    const separator = line.indexOf(':')
    if (separator < 0) return []
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
    return [[key, value === 'true' ? true : value === 'false' ? false : value]]
  })) as FrontMatter
  return { metadata, content: match[2].trim() }
}
