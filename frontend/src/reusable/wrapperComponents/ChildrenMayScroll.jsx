import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '@resources/themes/themeContext';
import '@resources/themes/scrollbar.css';

const ChildrenMayScroll = ({
  children,
  direction = 'vertical',
  className = '',
  style = {},
}) => {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (direction === 'vertical') {
        setOverflow(el.scrollHeight > el.clientHeight);
      } else {
        setOverflow(el.scrollWidth > el.clientWidth);
      }
    };

    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);

    return () => observer.disconnect();
  }, [direction]);

  return (
    <div
      ref={containerRef}
      className={`${className} ${overflow ? 'custom-scroll' : ''}`}
      style={{
        '--scrollbar-thumb': theme.colors.details,
        '--scrollbar-thumb-hover': `${theme.colors.details}ea`,
        overflowY:
          direction === 'vertical' ? (overflow ? 'auto' : 'hidden') : 'hidden',
        overflowX:
          direction === 'horizontal'
            ? overflow
              ? 'auto'
              : 'hidden'
            : 'hidden',
        maxHeight: '100%',
        maxWidth: '100%',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default ChildrenMayScroll;
