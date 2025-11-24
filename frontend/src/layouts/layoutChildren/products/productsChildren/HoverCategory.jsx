import { useState } from 'react';
import Nav from 'react-bootstrap/Nav';
import { useTheme } from '@resources/themes/themeContext';
import { NavLink, useLocation } from 'react-router-dom';

function HoverLink({ children, linksTo }) {
  const { theme } = useTheme();
  const [hover, setHover] = useState(false);
  const location = useLocation();

  const isActive = location.pathname.endsWith(linksTo);

  return (
    <Nav.Link
      as={NavLink}
      to={linksTo}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        color:
          hover
            ? theme.colors.splash
            : isActive
              ? theme.colors.splash
              : theme.colors.text,
        opacity: isActive ? 1 : 0.7,
        transition: 'color 0.2s ease, opacity 0.2s ease',
      }}
    >
      {children}
    </Nav.Link>
  );
}

export default HoverLink;
