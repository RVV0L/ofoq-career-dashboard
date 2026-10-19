import { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const ModeContext = createContext(null);

/** private = كل البيانات | public = بورتفوليو عام فقط */
export function ModeProvider({ children }) {
  const [mode, setMode] = useLocalStorage('mode', 'private');

  const value = useMemo(
    () => ({
      mode,
      isPrivate: mode === 'private',
      isPublic: mode === 'public',
      toggleMode: () => setMode((m) => (m === 'private' ? 'public' : 'private')),
    }),
    [mode, setMode]
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export const useMode = () => useContext(ModeContext);
