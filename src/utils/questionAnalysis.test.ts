import { describe, expect, it } from 'vitest'
import { analyzeAgentQuestion } from '../../server/agent/questionAnalysis.js'
import {
  formatExpertKnowledgeBase,
  searchMillonariosHistory,
  MILLONARIOS_TITLES,
  LIBERTADORES_FACT,
  formatLibertadoresSection,
} from '../../server/data/millonariosKnowledge.js'

describe('questionAnalysis', () => {
  it('detecta scouting', () => {
    const h = analyzeAgentQuestion('¿Qué refuerzo deberíamos fichar en mediocampo?')
    expect(h.wantsScouting).toBe(true)
  })

  it('detecta clasificación', () => {
    const h = analyzeAgentQuestion('¿Vamos a clasificar al top 8?')
    expect(h.wantsClassification).toBe(true)
  })

  it('detecta historia', () => {
    const h = analyzeAgentQuestion('Cuéntame la historia de Millonarios')
    expect(h.wantsHistory).toBe(true)
    expect(h.wantsGeneral).toBe(true)
  })

  it('detecta ídolos', () => {
    const h = analyzeAgentQuestion('¿Quién es Arnoldo Iguarán?')
    expect(h.wantsLegends).toBe(true)
  })

  it('detecta clásicos', () => {
    const h = analyzeAgentQuestion('Háblame del clásico con Santa Fe')
    expect(h.wantsRivalries).toBe(true)
  })

  it('detecta palmarés', () => {
    const h = analyzeAgentQuestion('¿Cuántos títulos de liga tiene Millonarios?')
    expect(h.wantsTitles).toBe(true)
  })

  it('detecta cultura e identidad', () => {
    const h = analyzeAgentQuestion('¿Por qué le dicen El Embajador?')
    expect(h.wantsCulture).toBe(true)
  })
})

describe('millonariosKnowledge', () => {
  it('no incluye Copa Libertadores en el palmarés', () => {
    const lib = MILLONARIOS_TITLES.find((t) => t.name.includes('Libertadores'))
    expect(lib).toBeUndefined()
  })

  it('aclara que Millonarios no tiene Libertadores', () => {
    expect(LIBERTADORES_FACT).toMatch(/NO ha ganado/)
    expect(formatLibertadoresSection()).toMatch(/NO ha ganado/)
  })

  it('busca historia por query de libertadores', () => {
    const blocks = searchMillonariosHistory('libertadores millonarios')
    expect(blocks.length).toBeGreaterThan(0)
    expect(blocks.join(' ')).toMatch(/NO ha ganado/)
  })

  it('genera base de conocimiento para preguntas generales', () => {
    const kb = formatExpertKnowledgeBase({
      wantsHistory: true,
      wantsTitles: true,
      searchQuery: 'Millonarios',
    })
    expect(kb).toMatch(/IDENTIDAD/)
    expect(kb).toMatch(/PALMARÉS/)
    expect(kb).not.toMatch(/Primera Copa Libertadores/)
  })
})
