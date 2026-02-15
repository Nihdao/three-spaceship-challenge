import { describe, it, expect } from 'vitest'
import StatLine from '../primitives/StatLine.jsx'

// Helper: shallow-render the component and inspect the returned vdom tree
function renderStatLine(props) {
  return StatLine(props)
}

function collectTexts(node) {
  if (!node) return []
  if (typeof node === 'string' || typeof node === 'number') return [String(node)]
  if (Array.isArray(node)) return node.flatMap(collectTexts)
  if (node.props?.children) return collectTexts(node.props.children)
  return []
}

function findByTitle(node, title) {
  if (!node) return null
  if (node.props?.title === title) return node
  const children = node.props?.children
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findByTitle(child, title)
      if (found) return found
    }
  } else if (children && typeof children === 'object') {
    return findByTitle(children, title)
  }
  return null
}

describe('StatLine', () => {
  it('renders label and value', () => {
    const vdom = renderStatLine({ label: 'HP', value: 100 })
    const texts = collectTexts(vdom)
    expect(texts).toContain('HP')
    expect(texts).toContain('100')
  })

  it('converts numeric value to string', () => {
    const vdom = renderStatLine({ label: 'Kills', value: 42 })
    const texts = collectTexts(vdom)
    expect(texts).toContain('42')
  })

  it('renders icon when provided', () => {
    const vdom = renderStatLine({ label: 'HP', value: 100, icon: '❤️' })
    const texts = collectTexts(vdom)
    expect(texts).toContain('❤️')
  })

  // Tooltip tests removed - tooltips no longer displayed in UI (Story 20.7)

  it('includes tabular-nums in value element className', () => {
    const vdom = renderStatLine({ label: 'Speed', value: 50 })
    // The value container is the second child of the outer div
    const children = vdom.props.children
    const valueContainer = Array.isArray(children) ? children[children.length - 1] : children
    // The value span is the first child of the value container
    const valueSpan = Array.isArray(valueContainer.props.children)
      ? valueContainer.props.children[0]
      : valueContainer.props.children
    expect(valueSpan.props.className).toContain('tabular-nums')
  })
})
