import { describe, expect, it } from 'vitest'

import { createDependencyGraph } from '#/spreadsheet/graph'

describe('DependencyGraph', () => {
  it('starts without relationships', () => {
    const { getDependenciesFor, getDependentsFor } = createDependencyGraph()

    expect(getDependenciesFor('A1')).toEqual(new Set())
    expect(getDependentsFor('A1')).toEqual(new Set())
  })

  it('indexes accepted relationships in both directions', () => {
    const { getDependenciesFor, getDependentsFor, setDependenciesFor } = createDependencyGraph()

    expect(setDependenciesFor('C1', new Set(['A1', 'B1']))).toBe(true)
    expect(getDependenciesFor('C1')).toEqual(new Set(['A1', 'B1']))
    expect(getDependentsFor('A1')).toEqual(new Set(['C1']))
    expect(getDependentsFor('B1')).toEqual(new Set(['C1']))
  })

  it('updates dependents when dependencies are replaced', () => {
    const { getDependenciesFor, getDependentsFor, setDependenciesFor } = createDependencyGraph()
    setDependenciesFor('C1', new Set(['A1', 'B1']))

    expect(setDependenciesFor('C1', new Set(['B1', 'D1']))).toBe(true)
    expect(getDependenciesFor('C1')).toEqual(new Set(['B1', 'D1']))
    expect(getDependentsFor('A1')).toEqual(new Set())
    expect(getDependentsFor('B1')).toEqual(new Set(['C1']))
    expect(getDependentsFor('D1')).toEqual(new Set(['C1']))
  })

  it('removes all relationships when dependencies are cleared', () => {
    const { getDependenciesFor, getDependentsFor, setDependenciesFor } = createDependencyGraph()
    setDependenciesFor('C1', new Set(['A1', 'B1']))

    expect(setDependenciesFor('C1', new Set())).toBe(true)
    expect(getDependenciesFor('C1')).toEqual(new Set())
    expect(getDependentsFor('A1')).toEqual(new Set())
    expect(getDependentsFor('B1')).toEqual(new Set())
  })

  it('rejects direct self-reference without changing the graph', () => {
    const { getDependenciesFor, getDependentsFor, setDependenciesFor } = createDependencyGraph()

    expect(setDependenciesFor('A1', new Set(['A1']))).toBe(false)
    expect(getDependenciesFor('A1')).toEqual(new Set())
    expect(getDependentsFor('A1')).toEqual(new Set())
  })

  it('rejects indirect cycles of any length', () => {
    const { getDependenciesFor, getDependentsFor, setDependenciesFor } = createDependencyGraph()
    setDependenciesFor('A1', new Set(['B1']))
    setDependenciesFor('B1', new Set(['C1']))

    expect(setDependenciesFor('C1', new Set(['A1']))).toBe(false)
    expect(getDependenciesFor('C1')).toEqual(new Set())
    expect(getDependentsFor('A1')).toEqual(new Set())
    expect(getDependentsFor('C1')).toEqual(new Set(['B1']))
  })

  it('preserves the previously accepted relationships after rejecting a replacement', () => {
    const { getDependenciesFor, getDependentsFor, setDependenciesFor } = createDependencyGraph()
    setDependenciesFor('B1', new Set(['A1']))
    setDependenciesFor('A1', new Set(['C1']))

    expect(setDependenciesFor('A1', new Set(['B1']))).toBe(false)
    expect(getDependenciesFor('A1')).toEqual(new Set(['C1']))
    expect(getDependentsFor('B1')).toEqual(new Set())
    expect(getDependentsFor('C1')).toEqual(new Set(['A1']))
  })

  it('does not confuse unrelated branches with cycles', () => {
    const { getDependenciesFor, setDependenciesFor } = createDependencyGraph()
    setDependenciesFor('B1', new Set(['A1']))
    setDependenciesFor('D1', new Set(['C1']))

    expect(setDependenciesFor('E1', new Set(['B1', 'D1']))).toBe(true)
    expect(getDependenciesFor('E1')).toEqual(new Set(['B1', 'D1']))
  })

  it('keeps other dependents when one is removed', () => {
    const { getDependenciesFor, getDependentsFor, setDependenciesFor } = createDependencyGraph()
    setDependenciesFor('B1', new Set(['A1']))
    setDependenciesFor('C1', new Set(['A1']))
    setDependenciesFor('B1', new Set())

    expect(getDependentsFor('A1')).toEqual(new Set(['C1']))
    expect(getDependenciesFor('C1')).toEqual(new Set(['A1']))
  })

  it('does not partially commit a rejected dependency set', () => {
    const { getDependenciesFor, getDependentsFor, setDependenciesFor } = createDependencyGraph()
    setDependenciesFor('B1', new Set(['A1']))

    expect(setDependenciesFor('A1', new Set(['B1', 'C1']))).toBe(false)
    expect(getDependenciesFor('A1')).toEqual(new Set())
    expect(getDependentsFor('B1')).toEqual(new Set())
    expect(getDependentsFor('C1')).toEqual(new Set())
  })

  it('copies the supplied dependency set before storing it', () => {
    const { getDependenciesFor, setDependenciesFor } = createDependencyGraph()
    const supplied = new Set(['A1'])
    setDependenciesFor('B1', supplied)

    supplied.clear()

    expect(getDependenciesFor('B1')).toEqual(new Set(['A1']))
  })
})
