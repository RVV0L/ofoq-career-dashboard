import { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/context/AuthContext';

const ModeContext = createContext(null);

/**
 * private = كل البيانات | public = بورتفوليو عام فقط.
 * الوضع الخاص متاح للمالك فقط: الزائر مفروض عليه public مهما كانت القيمة المخزّنة.
 */
export function ModeProvider({ children }) {
  const { isOwner } = useAuth();
  const [stored, setMode] = useLocalStorage('mode', 'private');
  const mode = isOwner && stored === 'private' ? 'private' : 'public';

  const value = useMemo(
    () => ({
      mode,
      isPrivate: mode === 'private',
      isPublic: mode === 'public',
      toggleMode: () => isOwner && setMode((m) => (m === 'private' ? 'public' : 'private')),
    }),
    [mode, setMode, isOwner]
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export const useMode = () => useContext(ModeContext);
