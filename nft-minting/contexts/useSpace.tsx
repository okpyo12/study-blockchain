import { createContext, ReactNode, useState } from "react";
import { PlanetName } from "../components/Planet";

interface ISpaceContext {
  planet: PlanetName;
  showPlanet: (planet: PlanetName) => void;
  clearPlanet: () => void;
}

export const SpaceContext = createContext<ISpaceContext>({
  planet: null,
  showPlanet: () => {},
  clearPlanet: () => {},
});

export const SpaceContextProvider = ({ children }: { children: ReactNode }) => {
  const [planet, setPlanet] = useState<PlanetName>(null);

  return (
    <SpaceContext.Provider
      value={{
        planet,
        showPlanet: (planet: PlanetName) => setPlanet(planet),
        clearPlanet: () => setPlanet(null),
      }}
    >
      {children}
    </SpaceContext.Provider>
  );
};
