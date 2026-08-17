const errors: string[] = []
const glob = new Bun.Glob('**/*')

for await (const relativePath of glob.scan('src')) {
  if (!relativePath.endsWith('.ts') && !relativePath.endsWith('.vue')) {
    continue
  }
  const path = `src/${relativePath}`
  const lines = (await Bun.file(path).text()).split('\n')
  if (lines.length > 100) errors.push(`${path}: ${lines.length} lines`)
  lines.forEach((line, index) => {
    if (line.length > 80) {
      errors.push(`${path}:${index + 1}: ${line.length} characters`)
    }
  })
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('Frontend file limits are respected.')

export {}
