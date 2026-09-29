const markdownFiles = import.meta.glob('../content/posts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

function parseFrontMatter(raw) {
  const match = raw.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/)
  if (!match) return { metadata: {}, content: raw }

  const metadata = Object.fromEntries(
    match[1].split('\n').flatMap((line) => {
      const separator = line.indexOf(':')
      if (separator < 0) return []
      const key = line.slice(0, separator).trim()
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
      return [[key, value === 'true' ? true : value === 'false' ? false : value]]
    }),
  )

  return { metadata, content: match[2].trim() }
}

export const posts = Object.entries(markdownFiles)
  .map(([path, raw]) => {
    const { metadata, content } = parseFrontMatter(raw)
    const slug = path.split('/').pop().replace('.md', '')
    return { ...metadata, slug, content }
  })
  .sort((a, b) => Number(b.featured) - Number(a.featured))

export function getPostBySlug(slug) {
  return posts.find((post) => post.slug === slug)
}
