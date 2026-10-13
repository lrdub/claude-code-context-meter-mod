import { describe, expect, test } from 'claude-code/testing'
import { formatContext } from './register'

describe('formatContext', () => {
  test('before the first response reports usage', () => {
    expect(formatContext(undefined)).toBe('ctx: 0% (0/150000 tokens)')
  })

  test('after a turn reports usage', () => {
    expect(formatContext(24000)).toBe('ctx: 16% (24000/150000 tokens)')
  })

  test('goes above 100% past the budget', () => {
    expect(formatContext(180000)).toBe('ctx: 120% (180000/150000 tokens)')
  })
})

describe('session.measure', () => {
  test('sets the status line when context changed', async ($, on) => {
    const lines: (string | undefined)[] = []
    on('ui.status', (_, e) => { lines.push(e.text); return { value: undefined } })
    on('session.measure', (_, e) => ({ changed: e.changed }))

    await $.session.measure({ context: { window: 200000 }, rateLimits: [], changed: ['context'] })
    await $.session.measure({ context: { tokens: 75000, window: 200000, percent: 38 }, rateLimits: [], changed: ['context'] })
    await $.session.measure({ context: { tokens: 75000, window: 200000, percent: 38 }, rateLimits: [], changed: ['cost'] })

    expect(lines).toEqual(['ctx: 0% (0/150000 tokens)', 'ctx: 50% (75000/150000 tokens)'])
  })
})
