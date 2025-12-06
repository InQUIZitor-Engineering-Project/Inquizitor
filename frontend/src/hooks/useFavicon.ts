import { useEffect } from 'react';
import defaultFavicon from "../assets/logo_book.png";

const useFavicon = (iconPath: string = defaultFavicon) => {
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    
    link.href = iconPath;

    return () => {
      link.href = '/default-favicon.ico'; 
    };

  }, [iconPath]);
};

export default useFavicon;