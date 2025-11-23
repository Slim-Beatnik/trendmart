import { useState } from 'react';
import Nav from 'react-bootstrap/Nav';
import { useTheme } from '@resources/themes/themeContext';
import { useLocation } from 'react-router-dom';

function HoverLink({ children, linksTo }) {
  const { theme } = useTheme();
  const [hover, setHover] = useState(false);
  const active = !useLocation().pathname.endsWith(linksTo);

  return (
    <Nav.Link
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      href={linksTo}
      disabled={!active}
      style={{
        color:
          hover && active
            ? theme.colors.splash
            : active
              ? theme.colors.text
              : `${theme.colors.text}80`,
        transition: 'color 0.2s ease, color 0.2s ease',
      }}
    >
      {children}
    </Nav.Link>
  );
}

export default HoverLink;
