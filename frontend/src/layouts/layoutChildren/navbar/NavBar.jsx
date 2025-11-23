import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Dropdown from 'react-bootstrap/Dropdown';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '@redux/auth/authSlice';
import LoginRegister from '@children/popupLayoutChildren/loginRegister/LoginRegister';
import { useTheme } from '@resources/themes/themeContext';
import Logo from '../logo/Logo';
import HoverLink from './HoverLink';

function NavBar({ setPopup }) {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/'); // Redirect to home page after successful logout
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if logout API call fails
      navigate('/');
    }
  };

  const LogRegLinkBtn = () => (
    <Button
      onClick={() => setPopup(<LoginRegister setPopup={setPopup} />)}
      className="px-3"
      style={{ ...theme.schemes.contrast, fontSize: '.9rem' }}
    >
      Login / Signup
    </Button>
  );

  const UserWelcome = () => {
    const userEmail = user?.email || 'User';

    return (
      <div className="d-flex align-items-center gap-3">
        <span
          style={{
            color: theme.colors.lightBg || 'white',
            fontSize: '.9rem',
          }}
          className="d-none d-sm-inline"
        >
          Welcome, <strong>{userEmail}</strong>
        </span>
        <Button
          onClick={handleLogout}
          variant="outline-light"
          size="sm"
          className="px-3"
          style={{ fontSize: '.9rem' }}
        >
          Logout
        </Button>
      </div>
    );
  };

  return (
    <Navbar
      expand="md"
      className="d-flex w-100 h-100 m-0 p-0 px-2 d-flex align-items-center"
      style={{
        backgroundColor: theme.colors.darkBg,
        borderRadius: `${Array(2).fill(theme.props.bR_more).join(' ')} 0 0`,
      }}
    >
      {/* LEFT: Logo + Brand */}
      <Col className="d-flex align-items-center flex-grow-1 gap-3">
        <Navbar.Brand
          className="d-flex align-items-center p-0 m-0"
          style={{
            height: '8vh',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          <Logo variant="white" />
        </Navbar.Brand>
        <h1
          id="title"
          className="mb-0 fs-3"
          style={{
            fontWeight: 700,
            color: theme.colors.lightBg
          }}
        >
          TrendMart
        </h1>
      </Col>

      {/* CENTER HoverLinkS */}
      <Nav className="d-none d-md-flex gap-4 ms-auto me-4">
        <HoverLink linksTo="/">Home</HoverLink>
        {isAuthenticated && <HoverLink linksTo="/profile">Profile</HoverLink>}

        <HoverLink linksTo="/contact">Contact</HoverLink>
      </Nav>

      {/* RIGHT: Authenticated or Login Button */}
      {isAuthenticated ? <UserWelcome /> : <LogRegLinkBtn />}
    </Navbar>
  );
}

export default NavBar;
