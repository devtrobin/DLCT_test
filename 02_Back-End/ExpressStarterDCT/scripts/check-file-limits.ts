const roots = ['src', 'scripts', 'prisma/models']
const extensions = ['.ts', '.prisma']
const errors: string[] = []

for (const root of roots) {
  const glob = new Bun.Glob('**/*')

  for await (const relativePath of glob.scan(root)) {
    if (relativePath.startsWith('generated/')) {
      continue
    }

    if (!extensions.some((extension) => relativePath.endsWith(extension))) {
      continue
    }

    const path = `${root}/${relativePath}`
    const lines = (await Bun.file(path).text()).split('\n')

    if (lines.length > 100) {
      errors.push(`${path}: ${lines.length} lines`)
    }

    lines.forEach((line, index) => {
      const prismaRelation = path.endsWith('.prisma') &&
        (line.includes('@relation(') || line.includes('@@unique('))

      if (line.length > 80 && !prismaRelation) {
        errors.push(`${path}:${index + 1}: ${line.length} characters`)
      }
    })
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('File limits are respected.')

export {}
