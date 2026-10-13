import type { Register } from 'claude-code'

// 100% means this many tokens, whatever the model's real window; usage past it reads above 100%.
export const BUDGET = 150_000

export const formatContext = (tokens: number | undefined): string => {
  const used = tokens ?? 0
  return `ctx: ${Math.round((used / BUDGET) * 100)}% (${used}/${BUDGET} tokens)`
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
