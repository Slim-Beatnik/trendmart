import { useState } from 'react';
import { useOutlet } from 'react-router-dom';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import GlobalAlert from '../layoutChildren/alert/GlobalAlert.jsx';
import MasterGrid from './MasterGrid.jsx';
import NavBar from '../layoutChildren/navbar/NavBar.jsx';
import PopupLayout from './PopupLayout.jsx';
import { useTheme } from '@resources/themes/themeContext.js';

function MasterLayout() {
  const routedPopup = useOutlet();
  const { theme } = useTheme();
  const [popup, setPopup] = useState(null);

  return (
    <>
      <Container
        id="superContainer"
        fluid
        className="m-0 justify-content-center align-items-center p-0 py-sm-3 px-sm-4"
        style={{
          minHeight: '100vh',
          backgroundImage: `radial-gradient(circle farthest-corner at bottom, ${theme.colors.details} 60%, ${theme.colors.lightBg}44 100%)`,
          backgroundColor: theme.colors.lightBg,
        }}
      >
        <Col
          id="navbarContainer"
          style={{ minWidth: '100%', marginBottom: '4vh' }}
        >
          <Row
            className="h-50"
            style={{
              borderRadius: `${Array(2).fill(theme.props.bR_more).join(' ')} 0 0`,
              overflow: 'hidden',
            }}
          >
            <NavBar setPopup={setPopup} />
          </Row>
          <Row
            className="h-50"
            style={{
              backgroundColor: theme.alerts.success,
              borderRadius: `0 0 ${Array(2).fill(theme.props.bR_more).join(' ')}`,
            }}
          >
            <GlobalAlert />
          </Row>
        </Col>

        <Row
          id="mGrid-popupContainer"
          className="pb-2"
          style={{}}
        >
          <Col
            className="w-100 m-0 p-0"
            style={{ borderRadius: theme.props.bR_more }}
          >
            <MasterGrid />
          </Col>
        </Row>
      </Container>
      {/* State-based popup (NOT routed) */}
      {popup && <PopupLayout>{popup}</PopupLayout>}

      {/* Route-based popup (via URL) */}
      {routedPopup && <PopupLayout>{routedPopup}</PopupLayout>}
    </>
  );
}

export default MasterLayout;
