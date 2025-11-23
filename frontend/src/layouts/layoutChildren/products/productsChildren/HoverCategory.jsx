import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Nav from 'react-bootstrap/Nav';
import { useTheme } from '@resources/themes/themeContext';

function HoverCategory({ children, linksTo = '#' }) {
  const { theme } = useTheme();
  const [hover, setHover] = useState(false);
  const active = !useLocation().pathname.endsWith(linksTo);

  return (
    <Nav className="w-100">
      <Nav.Link
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        href={linksTo}
        disabled={!active}
        className="w-100"
        style={{
          color:
            hover && active
              ? theme.colors.splash
              : active
                ? theme.colors.contrast
                : `${theme.colors.contrast}80`,
          backgroundColor:
            hover && active
              ? '#e8e8e8e8'
              : active
                ? 'transparent'
                : `${theme.colors.details}a0`,
          transition: 'color 0.2s ease, border-color 0.2s ease',
        }}
      >
        {active ? (
          children
        ) : (
          <div
            className="p-1"
            style={{
              width: 'fit-content',
              pointerEvents: 'none',
              borderRadius: '.3rem .5rem .5rem .3rem',
              backgroundColor: theme.colors.highlight,
            }}
          >
            {children}
          </div>
        )}
      </Nav.Link>
    </Nav>
  );
}

export default HoverCategory;
