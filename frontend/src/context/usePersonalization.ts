import { useContext } from "react";
import { PersonalizationContext } from "./PersonalizationContext";

export function usePersonalization() {
  const context = useContext(PersonalizationContext);
  if (!context) {
    throw new Error("usePersonalization must be used within a PersonalizationProvider");
  }
  return context;
}
