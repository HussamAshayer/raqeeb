import { createContext, useContext } from "react";

export const RoleContext = createContext({
  role: null,
  roleLoading: true,
  isTeacher: false,
});

export function useRoleContext() {
  return useContext(RoleContext);
}
