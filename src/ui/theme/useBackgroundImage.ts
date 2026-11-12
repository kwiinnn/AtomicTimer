import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo } from 'react';
import { useApp } from '../state/AppContext';

/** Object URL for the stored background image, or null. Revoked when the image changes. */
export function useBackgroundImageUrl(): string | null {
  const { storage, settings } = useApp();
  const blob = useLiveQuery(() => storage.getAsset('background'), [storage]);
  const url = useMemo(() => (blob && settings.backgroundImage ? URL.createObjectURL(blob) : null), [blob, settings.backgroundImage]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
}
