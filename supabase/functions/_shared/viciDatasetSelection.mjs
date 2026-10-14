// Selection is an uploader attestation, not evidence encoded by VICIdial CSVs.
export function validateDatasetSelection(value, campaigns) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !['kind','campaigns','confirmed'].includes(k)) || !['general','run_test'].includes(value.kind) || value.confirmed !== true ||
      !Array.isArray(value.campaigns) || !value.campaigns.length || value.campaigns.length > 100 ||
      new Set(value.campaigns).size !== value.campaigns.length ||
      !value.campaigns.every(c => typeof c === 'string' && campaigns.includes(c))) return null
  const selected = [...value.campaigns].sort()
  if (value.kind === 'run_test' && selected.join(',') !== 'Openers5,Openers6') return null
  return { kind: value.kind, campaigns: selected, confirmed: true }
}
