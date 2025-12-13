import { useEffect } from 'react';

export function Clarity() {
  useEffect(() => {
    const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID;
    
    if (!projectId) {
      console.warn('Microsoft Clarity project ID not found in environment variables');
      return;
    }

    // Initialize Microsoft Clarity
    (function(c, l, a, r, i, t, y) {
      c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments) };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", projectId);
  }, []);

  return null;
}

