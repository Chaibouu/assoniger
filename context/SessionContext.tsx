// context/SessionContext.tsx
"use client";

import { User } from "@/types/user";
import { createContext, useContext, ReactNode, useMemo, useCallback } from "react";

type SessionContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
};

// Créer le contexte
const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({
  user,
  children,
}: {
  user: User | null;
  children: ReactNode;
}) => {
  const isAuthenticated = useMemo(() => !!user, [user]);

  const refreshUser = useCallback(async () => {
    // Cette fonction peut être utilisée pour rafraîchir les données utilisateur
    // Par exemple, après une mise à jour de profil
    try {
      // Ici vous pouvez appeler une API pour rafraîchir les données
      // const updatedUser = await fetchUserData();
      // setUser(updatedUser);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement de l'utilisateur:", error);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading: false, // Vous pouvez ajouter un état de chargement si nécessaire
      refreshUser,
    }),
    [user, isAuthenticated, refreshUser]
  );

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession doit être utilisé à l'intérieur de SessionProvider");
  }
  return context;
};

// Hook pour vérifier si l'utilisateur est authentifié
export const useAuth = () => {
  const { isAuthenticated, user } = useSession();
  return { isAuthenticated, user };
};
