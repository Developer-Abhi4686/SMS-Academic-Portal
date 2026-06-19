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
  // Clear all session storage to ensure no data leaks between users
  sessionStorage.clear();
  
  // Clear specific local storage keys
  const localKeys = ['sms_role', 'sms_userClass', 'sms_userSection'];
  localKeys.forEach(key => localStorage.removeItem(key));
}
