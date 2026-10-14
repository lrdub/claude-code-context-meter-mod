import type { Register } from 'claude-code'

// 100% means this many tokens, whatever the model's real window; usage past it reads above 100%.
export const BUDGET = 150_000

// Cells in the bar; it fills at 100% and stays full beyond.
export const BAR_WIDTH = 10

export const formatBar = (fraction: number): string => {
  const filled = Math.min(BAR_WIDTH, Math.max(0, Math.round(fraction * BAR_WIDTH)))
  return '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled)
}

export const formatContext = (tokens: number | undefined): string => {
  const used = tokens ?? 0
  const fraction = used / BUDGET
  return `ctx: ${formatBar(fraction)} ${Math.round(fraction * 100)}% (${used}/${BUDGET} tokens)`
}

export const register: Register = on => {
  on('session.start', ($, e, next) => {
    $.ui.status(formatContext(undefined))
    return next(e)
  })

  on('session.measure', ($, e, next) => {
    if (e.changed.includes('context')) $.ui.status(formatContext(e.context.tokens))
    return next(e)
  })
}
