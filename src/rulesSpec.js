export function parseRulesSpec(text) {
  const rules = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  if (rules.length === 0) {
    throw new Error('File is empty')
  }

  return rules
}
