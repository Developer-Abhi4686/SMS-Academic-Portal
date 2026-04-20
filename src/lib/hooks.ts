import { useState, useEffect } from 'react';

/**
 * A hook that works like useState but persists the value in sessionStorage.
 * This ensures that when a component unmounts (e.g. during navigation),
 * the state is restored when the component mounts again in the same session.
 */
export function useSessionState<T>(key: string, initialState: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const saved = sessionStorage.getItem(`sms_session_${key}`);
    return saved ? JSON.parse(saved) : initialState;
  });

  useEffect(() => {
    sessionStorage.setItem(`sms_session_${key}`, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

export function clearSessionStates() {
  const keysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith('sms_session_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => sessionStorage.removeItem(key));
}
