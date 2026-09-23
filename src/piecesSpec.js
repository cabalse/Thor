const REQUIRED_STATS = ['m', 'a', 'd']

export function parsePiecesSpec(text) {
  const pieces = []
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  if (lines.length === 0) {
    throw new Error('File is empty')
  }

  for (const line of lines) {
    const parts = line.split('-').map((p) => p.trim())
    if (parts.length < 5) {
      throw new Error(`Expected "PieceID - Name - Side - AreaID - [m: X, a: Y, d: Z]" in line: "${line}"`)
    }

    const [id, name, side, areaId, ...rest] = parts
    if (!id) throw new Error(`Missing piece id in line: "${line}"`)
    if (!name) throw new Error(`Missing name in line: "${line}"`)
    if (!side) throw new Error(`Missing side in line: "${line}"`)
    if (!areaId) throw new Error(`Missing area id in line: "${line}"`)

    const statsPart = rest.join('-').trim()
    const bracketMatch = statsPart.match(/^\[(.*)\]$/)
    if (!bracketMatch) {
      throw new Error(`Expected stats in "[m: X, a: Y, d: Z]" form in line: "${line}"`)
    }

    const stats = {}
    for (const entry of bracketMatch[1].split(',')) {
      const [key, value] = entry.split(':').map((s) => s.trim())
      if (!key || !value) {
        throw new Error(`Malformed stat "${entry.trim()}" in line: "${line}"`)
      }
      const num = Number(value)
      if (Number.isNaN(num)) {
        throw new Error(`Stat "${key}" must be a number in line: "${line}"`)
      }
      stats[key] = num
    }

    for (const key of REQUIRED_STATS) {
      if (!(key in stats)) {
        throw new Error(`Missing stat "${key}" in line: "${line}"`)
      }
    }

    pieces.push({ id, name, side, areaId, stats: { m: stats.m, a: stats.a, d: stats.d } })
  }

  return pieces
}
