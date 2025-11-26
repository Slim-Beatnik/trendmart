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
import HoverCategory from '@children/products/productsChildren/HoverCategory';
import '@resources/themes/scrollbar.css';

const Profile = () => {
  const { user, isAuthenticated, token, status: authStatus } = useSelector((state) => state.auth);
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const [contactInfo, setContactInfo] = useState({
    first_name: '',
    last_name: '',
    phone: ''
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

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        dispatch(clearStatus()); 
        
        const userProfile = await getProfile();
   
        // Update form with fetched data
        setContactInfo({
          first_name: userProfile.first_name || '',
          last_name: userProfile.last_name || '',
          phone: userProfile.phone || '',
        });
        
        dispatch(setStatus({
          message: 'Profile loaded successfully!',
          variant: 'success'
        }));
      } catch (err) {
        console.error('Error fetching user data:', err);
        dispatch(setStatus({
          message: 'Failed to load profile data. Please try again.',
          variant: 'error'
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [dispatch]);

  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous status messages
    dispatch(clearStatus());
    
    // Basic validation
    if (!contactInfo.first_name.trim() || !contactInfo.last_name.trim()) {
      dispatch(setStatus({
        message: 'Please fill in both first name and last name.',
        variant: 'error'
      }));
      return;
    }

    try {
      setSaving(true);
      
      dispatch(setStatus({
        message: 'Saving profile changes...',
        variant: 'info'
      }));
      
      await upsertProfile(contactInfo);
      
      dispatch(setStatus({
        message: 'Profile updated successfully!',
        variant: 'success'
      }));
      
      console.log('Profile saved successfully:', contactInfo);
    } catch (err) {
      console.error('Error saving profile:', err);
      dispatch(setStatus({
        message: 'Failed to save profile changes. Please try again.',
        variant: 'error'
      }));
    } finally {
      setSaving(false);
    }
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
       <Col
      className="d-inline-flex flex-column flex-sm-grow-0 position-relative justify-content-between align-items-center gap-1  m-auto"
      style={{
        minWidth: '100%',
        ...theme.schemes.darkText,
        borderRadius: theme.props.bR_less,
        filter: `drop-shadow(.5rem .5rem 1rem ${theme.colors.contrast}e8)`
      }}
    >
        <div className="text-center">
          <Spinner animation="border" role="status" style={{ marginBottom: '1rem' }}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading your profile...</p>
        </div>
      </Col>
    );
  } 
  
  return (
    <Col
      className="d-inline-flex flex-column flex-sm-grow-0 position-relative justify-content-between align-items-center gap-1 px-2 py-4 m-auto w-100"
      style={{
        ...theme.schemes.darkText,
        borderRadius: theme.props.bR_less,
        filter: `drop-shadow(.5rem .5rem 1rem ${theme.colors.contrast}e8)`
      }}
    >
      <Row className="h-100 w-100 justify-content-center  my-auto">

     
        <Tab.Container id="left-tabs-example" defaultActiveKey="contactInfo">
          {/* Tab Navigation - Responsive */}
          <Col xs={12} md={3} className="mb-3 mb-md-0">
            <Nav variant="pills" className="flex-row flex-md-column justify-content-center">
              <Nav.Item className="flex-fill flex-md-grow-0">
                <Nav.Link 
                  eventKey="contactInfo"
                  className="text-center text-md-start"
                  style={{ fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}
                >
                  <span className="d-md-none">Contact</span>
                  <span className="d-none d-md-inline">Contact Information</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="flex-fill flex-md-grow-0">
                <Nav.Link 
                  eventKey="address"
                  className="text-center text-md-start"
                  style={{ fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}
                >
                  Address
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="flex-fill flex-md-grow-0">
                <Nav.Link 
                  eventKey="security"
                  className="text-center text-md-start"
                  style={{ fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}
                >
                  Security
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>

          {/* Tab Content */}
          <Col xs={12} md={9} className="p-3 p-md-4" style={{ backgroundColor: theme.colors.whiteBg }}>
            <Tab.Content className="p-3 rounded">
              <Tab.Pane eventKey="contactInfo">
                <h4>Contact Information</h4>
                <Form className="mt-3" onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="firstName">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control 
                      type="text"
                      name="first_name" 
                      value={contactInfo.first_name}
                      onChange={handleChange} 
                      placeholder="Enter first name" 
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="lastName">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="last_name"
                      value={contactInfo.last_name}
                      onChange={handleChange} 
                      placeholder="Enter last name" 
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="phone">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control 
                      type="tel" 
                      name="phone"
                      value={contactInfo.phone}
                      onChange={handleChange} 
                      placeholder="Enter phone number" 
                    />
                  </Form.Group>

                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={saving}
                    className="d-flex align-items-center gap-2"
                  >
                    {saving && (
                      <Spinner 
                        animation="border" 
                        size="sm"
                        role="status"
                      />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Form>
              </Tab.Pane>

               <Tab.Pane eventKey="address">
                <Address />
              </Tab.Pane>

              <Tab.Pane eventKey="security">
                <h4>Security Settings</h4>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Current Password</Form.Label>
                    <Form.Control type="password" placeholder="Enter current password" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control type="password" placeholder="Enter new password" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control type="password" placeholder="Confirm new password" />
                  </Form.Group>
                  <Button variant="primary" type="submit">
                    Change Password
                  </Button>
                </Form>
              </Tab.Pane> 
            </Tab.Content>
          </Col>
          
        </Tab.Container>
        </Row>
      </Col>
      
   
  );

}

export default Profile;
