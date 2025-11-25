import { useState, useEffect } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { setStatus, clearStatus } from '@redux/status/statusSlice';
import { useTheme } from '@resources/themes/themeContext';
import { getProfile, upsertProfile } from '@api/customer';
import Address from './Address';
import HoverCategory from '../../products/productsChildren/HoverCategory';
import '@resources/themes/scrollbar.css';

const Profile = () => {
  const {
    user,
    isAuthenticated,
    token,
    status: authStatus,
  } = useSelector((state) => state.auth);
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [contactInfo, setContactInfo] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Determine which tab to show based on URL
  const getTabFromURL = () => {
    if (location.pathname.endsWith('/address')) return 'address';
    if (location.pathname.endsWith('/security')) return 'security';
    if (location.pathname.endsWith('/contact-info')) return 'contactInfo';
    // if (location.pathname.endsWith('/setting')) return 'settings';
    return;
  };

  const activeTab = getTabFromURL();

  const fetchCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      console.log('Current user fetched:', user);
      return user;
    } catch (err) {
      console.error('Error fetching current user:', err);
      return null;
    }
  };
  // Fetch profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        dispatch(clearStatus());

        const userProfile = await getProfile();

        setContactInfo({
          first_name: userProfile.first_name || '',
          last_name: userProfile.last_name || '',
          phone: userProfile.phone || '',
        });

        dispatch(
          setStatus({
            message: 'Profile loaded successfully!',
            variant: 'success',
          })
        );
      } catch (err) {
        console.error('Error fetching user data:', err);
        dispatch(
          setStatus({
            message: 'Failed to load profile data. Please try again.',
            variant: 'error',
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearStatus());

    if (!contactInfo.first_name.trim() || !contactInfo.last_name.trim()) {
      dispatch(
        setStatus({
          message: 'Please fill in both first name and last name.',
          variant: 'error',
        })
      );
      return;
    }

    try {
      setSaving(true);
      dispatch(
        setStatus({ message: 'Saving profile changes...', variant: 'info' })
      );

      await upsertProfile(contactInfo);

      dispatch(
        setStatus({
          message: 'Profile updated successfully!',
          variant: 'success',
        })
      );
    } catch (err) {
      console.error('Error saving profile:', err);
      dispatch(
        setStatus({
          message: 'Failed to save profile changes. Please try again.',
          variant: 'error',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Row
      className="w-100 h-100 d-flex flex-row m-0"
      style={{
        backgroundColor: theme.colors.whiteBg,
        padding: '2rem',
        borderRadius: theme.props.bR,
      }}
    >
      {/* LEFT — Sidebar */}
      <Col
        xs={12}
        md={3}
        className="flex-column d-none d-sm-flex justify-content-start p-0 me-4"
        style={{
          maxWidth: '20%',
          height: '98%',
          borderRight: `.13rem solid ${theme.colors.details}`,
        }}
      >
        <Nav
          variant="pills"
          className="flex-column"
        >
          <h3>Profile</h3>

          <HoverCategory
            eventKey="contactInfo"
            onClick={() => navigate('/profile/contact-info')}
          >
            Contact
          </HoverCategory>

          <Nav.Link
            eventKey="address"
            onClick={() => navigate('/profile/address')}
          >
            Address
          </Nav.Link>

          <Nav.Link
            eventKey="security"
            onClick={() => navigate('/profile/security')}
          >
            Security
          </Nav.Link>
        </Nav>
      </Col>

      {/* RIGHT — Content */}
      <Col
        xs={12}
        md={9}
        className="d-flex flex-column h-100 w-100"
        style={{ paddingLeft: '3rem', gap: '2rem' }}
      >
        <Tab.Content
          className="rounded custom-scroll"
          style={{
            overflowY: 'auto',
            borderLeft: `.13rem solid ${theme.colors.details}`,
            paddingLeft: '2rem',
          }}
        >
          {/* your Tab.Pane sections unchanged */}
        </Tab.Content>
      </Col>
    </Row>
  );
};

export default Profile;
