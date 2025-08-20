import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // Corresponde ao breakpoint 'md' do Tailwind CSS

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Define o estado inicial
    checkMobile();

    // Adiciona um listener para redimensionamento da janela
    window.addEventListener('resize', checkMobile);

    // Limpa o listener ao desmontar o componente
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
};