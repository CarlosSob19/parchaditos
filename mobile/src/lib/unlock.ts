import { createContext, useContext } from 'react';

// true cuando el usuario ya confirmó que es mayor de edad. Las animaciones de entrada esperan a esto.
export const UnlockContext = createContext(false);
export const useUnlocked = () => useContext(UnlockContext);
