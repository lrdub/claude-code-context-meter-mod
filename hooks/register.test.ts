import { describe, expect, test } from 'claude-code/testing'
import { formatBar, formatContext } from './register'

describe('formatBar', () => {
  test('fills in proportion and clamps at both ends', () => {
    expect(formatBar(0)).toBe('░░░░░░░░░░')
    expect(formatBar(0.5)).toBe('█████░░░░░')
    expect(formatBar(1)).toBe('██████████')
    expect(formatBar(1.6)).toBe('██████████')
  })
})

describe('formatContext', () => {
  test('before the first response reports usage', () => {
    expect(formatContext(undefined)).toBe('ctx: ░░░░░░░░░░ 0% (0/150000 tokens)')
  })

  test('after a turn reports usage', () => {
    expect(formatContext(24000)).toBe('ctx: ██░░░░░░░░ 16% (24000/150000 tokens)')
  })

  test('goes above 100% past the budget', () => {
    expect(formatContext(180000)).toBe('ctx: ██████████ 120% (180000/150000 tokens)')
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

    expect(lines).toEqual(['ctx: ░░░░░░░░░░ 0% (0/150000 tokens)', 'ctx: █████░░░░░ 50% (75000/150000 tokens)'])
  })
})

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 80, scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

describe('AbovePrompt band', () => {
  test('shows the meter on desktop and follows context', async ($, on) => {
    on('ui.status', () => ({ value: undefined }))
    on('session.measure', (_, e) => ({ changed: e.changed }))
    const ui = await $.ui.mount({ plugin: 'context-meter', surface: 'desktop', ...BAND })
    expect((await ui.find({ type: 'Text', text: /ctx/ }))?.text).toBe('ctx: ░░░░░░░░░░ 0% (0/150000 tokens)')

    await $.session.measure({ context: { tokens: 75000, window: 200000, percent: 38 }, rateLimits: [], changed: ['context'] })
    expect((await ui.find({ type: 'Text', text: /ctx/ }))?.text).toBe('ctx: █████░░░░░ 50% (75000/150000 tokens)')
    await ui.unmount()
  })

  test('stays out of the terminal, which has the status line', async ($, on) => {
    on('ui.render', () => ({ type: 'Box', children: [] }))
    const ui = await $.ui.mount({ plugin: 'context-meter', surface: 'terminal', ...BAND })
    expect(await ui.find({ type: 'Text', text: /ctx/ })).toBeUndefined()
    await ui.unmount()
  })
})
