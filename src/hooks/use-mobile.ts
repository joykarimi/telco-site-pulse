
import { useState, useEffect } from 'react';

export const useIsMobile = (query: string = '(max-width: 768px)') => {
    const [isMobile, setIsMobile] = useState(window.matchMedia(query).matches);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const handleResize = () => setIsMobile(mediaQuery.matches);

        mediaQuery.addEventListener('change', handleResize);
        return () => mediaQuery.removeEventListener('change', handleResize);
    }, [query]);

    return isMobile;
};
