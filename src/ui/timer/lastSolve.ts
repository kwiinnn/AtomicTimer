import type { Solve } from '../../core/model';

/**
 * Which solve penalty/delete/comment shortcuts act on. `recorded` is the solve made in this view
 * (id null while its write is still in flight); acting on solves.at(-1) then would hit the previous solve.
 */
export function shortcutTarget(solves: Solve[], recorded: { id: string | null } | null): Solve | null {
  if (recorded) return recorded.id ? (solves.find(s => s.id === recorded.id) ?? null) : null;
  return solves.at(-1) ?? null;
}
