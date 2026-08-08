import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Habits, goals and journal entries must be editable.
 *
 * They weren't, and the gap was invisible from the code: habits and goals had a
 * working PATCH endpoint with no UI reaching it, goals carried an `editingGoal`
 * state that was declared and never read, and the journal had no PATCH at all.
 * Every page looked finished. A user could create a habit and delete it but
 * never fix a typo in it.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

const ENTITIES = [
  {
    name: 'journal',
    api: 'src/app/api/journal/[id]/route.ts',
    page: 'src/app/(dashboard)/journal/page.tsx',
    editState: 'editingId',
    closer: 'closeEditor',
  },
  {
    name: 'habits',
    api: 'src/app/api/habits/[id]/route.ts',
    page: 'src/app/(dashboard)/habits/page.tsx',
    editState: 'editingHabitId',
    closer: 'closeHabitEditor',
  },
  {
    name: 'goals',
    api: 'src/app/api/goals/[id]/route.ts',
    page: 'src/app/(dashboard)/goals/page.tsx',
    editState: 'editingGoalId',
    closer: 'closeGoalEditor',
  },
] as const

describe('editability', () => {
  it('exposes an update endpoint for each entity', () => {
    for (const { name, api } of ENTITIES) {
      expect(read(api), `${name} needs PATCH`).toMatch(/export async function PATCH/)
    }
  })

  it('reaches that endpoint from the page', () => {
    // A PATCH route nothing calls is what habits and goals both had.
    for (const { name, page } of ENTITIES) {
      expect(read(page), `${name} page must issue a PATCH`).toMatch(/'PATCH'/)
    }
  })

  it('tracks what is being edited, and actually reads it', () => {
    for (const { name, page, editState } of ENTITIES) {
      const src = read(page)
      const uses = src.split(editState).length - 1
      // Declared once and read at least three times: the save branch, the modal
      // heading and the submit label. `editingGoal` scored 1 — declared, never
      // read — which is how it passed review.
      expect(uses, `${name}: ${editState} looks unused`).toBeGreaterThan(3)
    }
  })

  it('clears the edit target through a single close path', () => {
    // Resetting the form and clearing the id in separate places is how a stale
    // id turns the next "New…" into an edit of the last item.
    for (const { name, page, closer, editState } of ENTITIES) {
      const src = read(page)
      expect(src, `${name} needs ${closer}`).toContain(`const ${closer}`)

      const body = src.slice(src.indexOf(`const ${closer}`))
      const fn = body.slice(0, body.indexOf('\n  }') + 4)
      // The setter, not the state name: `setEditingId` does not contain
      // `editingId` — the capital E after "set" makes it a different string.
      const setter = `set${editState[0].toUpperCase()}${editState.slice(1)}`
      expect(fn, `${closer} must clear ${editState} via ${setter}`).toContain(`${setter}(null)`)
    }
  })

  it('has no leftover dead edit state', () => {
    // The specific corpse: `setEditingGoal` with no reader.
    const goals = read('src/app/(dashboard)/goals/page.tsx')
    expect(goals).not.toMatch(/setEditingGoal\b/)
  })
})
