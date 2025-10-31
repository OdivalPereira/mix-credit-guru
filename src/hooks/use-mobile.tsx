import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * @description Um hook React que detecta se o dispositivo do usuário é móvel com base na largura da tela.
 * @returns {boolean} `true` se a largura da tela for menor que o ponto de interrupção móvel, caso contrário `false`.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
