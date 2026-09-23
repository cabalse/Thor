export function parseGameSpec(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim())

  let i = 0
  while (i < lines.length && lines[i] === '') i++
  if (i >= lines.length) {
    throw new Error('File is empty')
  }

  const sidesMatch = lines[i].match(/^sides:\s*(.*)$/i)
  if (!sidesMatch) {
    throw new Error(`Expected first line to start with "Sides:", got: "${lines[i]}"`)
  }

  const sides = sidesMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
  if (sides.length < 2) {
    throw new Error('At least 2 sides are required')
  }
  if (new Set(sides.map((s) => s.toLowerCase())).size !== sides.length) {
    throw new Error('Side names must be unique')
  }
  i++

  const areas = {}
  for (; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    const parts = line.split('-').map((p) => p.trim())
    if (parts.length < 3) {
      throw new Error(`Expected "AreaID - Terrain - ConnectedID, ConnectedID, ..." in line: "${line}"`)
    }

    const [id, terrain, ...rest] = parts
    if (!id) throw new Error(`Missing area id in line: "${line}"`)
    if (!terrain) throw new Error(`Missing terrain in line: "${line}"`)

    const connectionsPart = rest.join('-').trim()
    const connections = connectionsPart ? connectionsPart.split(',').map((c) => c.trim()).filter(Boolean) : []
    areas[id] = { terrain, connections }
  }

  if (Object.keys(areas).length === 0) {
    throw new Error('No board areas defined')
  }

  return { sides, areas }
}
