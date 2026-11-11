import Box from '@mui/material/Box';
import { useEffect, useRef } from 'react';
import type { TwistyPlayer } from 'cubing/twisty';
import { PUZZLES, type PuzzleId } from '../../core/model';

interface Props {
  puzzle: PuzzleId;
  scramble: string;
  onClick?: () => void;
  height?: number | string;
}

/** 2D net of the scrambled puzzle, rendered by cubing.js. The player is reused while the puzzle type stays the same. */
export function ScrambleImage({ puzzle, scramble, onClick, height = 120 }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<TwistyPlayer | null>(null);
  const scrambleRef = useRef(scramble);
  const cubingPuzzle = PUZZLES[puzzle].cubingPuzzle;

  useEffect(() => {
    scrambleRef.current = scramble;
    if (player.current) player.current.experimentalSetupAlg = scramble;
  }, [scramble]);

  useEffect(() => {
    const el = host.current;
    let cancelled = false;
    void import('cubing/twisty').then(({ TwistyPlayer }) => {
      if (cancelled || !el) return;
      const p = new TwistyPlayer({
        puzzle: cubingPuzzle as never,
        alg: '',
        visualization: '2D',
        controlPanel: 'none',
        background: 'none',
        hintFacelets: 'none',
      });
      p.style.width = '100%';
      p.style.height = '100%';
      el.replaceChildren(p);
      player.current = p;
      p.experimentalSetupAlg = scrambleRef.current;
    });
    return () => {
      cancelled = true;
      player.current = null;
      el?.replaceChildren();
    };
  }, [cubingPuzzle]);

  return (
    <Box
      data-testid="scramble-image"
      ref={host}
      onClick={onClick}
      sx={{ height, aspectRatio: '4 / 3', cursor: onClick ? 'zoom-in' : 'default' }}
      role={onClick ? 'button' : 'img'}
      aria-label="Scramble preview"
    />
  );
}
