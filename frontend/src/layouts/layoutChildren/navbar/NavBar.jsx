import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Dropdown from 'react-bootstrap/Dropdown';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '@redux/auth/authSlice';
import LoginRegister from '@popupChildren/loginRegister/LoginRegister';
import { useTheme } from '@resources/themes/themeContext';
import Logo from '@children/logo/Logo';
import HoverLink from './HoverLink';
import { selectCartQuantity } from '@redux/cart/cartSlice';
import CartPopup from '@popupChildren/cart/CartPopup';

function NavBar({ setPopup }) {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const cartQuantity = useSelector(selectCartQuantity);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/');
    } catch {
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
          style={{ color: theme.colors.lightBg || 'white', fontSize: '.9rem' }}
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

  const CartButton = () => {
    const hasItems = cartQuantity > 0;
    return (
      <Button
        variant={hasItems ? 'outline-light' : 'secondary'}
        className="position-relative px-3 py-1 d-flex align-items-center gap-1"
        style={{ fontSize: '.8rem' }}
        onClick={() => setPopup(<CartPopup setPopup={setPopup} />)}
      >
        <span style={{ fontWeight: 600 }}>Cart</span>
        {hasItems && (
          <span
            className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '.6rem', padding: '0.25rem 0.4rem' }}
          >
            {cartQuantity}
          </span>
        )}
      </Button>
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
      <Col className="d-flex align-items-center flex-grow-1 gap-3">
        <Navbar.Brand
          className="d-flex align-items-center p-0 m-0"
          style={{ height: '8vh', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <Logo color={theme.colors.text} />
        </Navbar.Brand>
        <h1
          id="title"
          className="mb-0 fs-3"
          style={{ fontWeight: 700, color: theme.colors.text }}
        >
          TrendMart
        </h1>
      </Col>

      <Nav className="d-none d-md-flex gap-4 ms-auto me-4">
        <HoverLink linksTo="/">Home</HoverLink>
        {isAuthenticated && <HoverLink linksTo="/profile">Profile</HoverLink>}
        <HoverLink linksTo="/contact">Contact</HoverLink>
      </Nav>

      <div className="d-flex align-items-center gap-2">
        <CartButton />
        {isAuthenticated ? <UserWelcome /> : <LogRegLinkBtn />}
      </div>
    </Navbar>
  );
}

export default NavBar;
