import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setStatus, clearStatus } from '@redux/status/statusSlice';
import {
  getCurrentUser,
  getAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress,
} from '@api/customer';
import { US_STATES } from '@utils/constants';

const Address = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  const [newAddress, setNewAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
  });

  const handleChangeAddress = (e) => {
    const { name, value } = e.target;
    setNewAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setNewAddress({
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
    });
    setShowAddForm(false);
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
  };

  useEffect(() => {
    if (user) {
      setAuthUser(user);
    }
  }, [user]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const addressesData = await getAddresses();
        setAddresses(addressesData || []);

        dispatch(
          setStatus({
            message: `Found ${addressesData?.length || 0} saved addresses.`,
            variant: 'info',
          })
        );
      } catch (err) {
        console.error('Error fetching addresses:', err);
        dispatch(
          setStatus({
            message: 'Failed to load addresses.',
            variant: 'error',
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [dispatch]);

  const handleSubmitAddress = async (e) => {
    e.preventDefault();
    setSaving(true);
    dispatch(clearStatus());

    try {
      await addAddress(newAddress);
      dispatch(
        setStatus({
          message: 'Address saved successfully!',
          variant: 'success',
        })
      );

      // Refresh addresses list
      const updatedAddresses = await getAddresses();
      setAddresses(updatedAddresses || []);

      // Reset form and hide it
      resetForm();
    } catch (err) {
      console.error('Error saving address:', err);
      dispatch(
        setStatus({
          message: 'Failed to save address.',
          variant: 'error',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await deleteAddress(addressId);
      dispatch(
        setStatus({
          message: 'Address deleted successfully!',
          variant: 'success',
        })
      );

      // Refresh addresses list
      const updatedAddresses = await getAddresses();
      setAddresses(updatedAddresses || []);
    } catch (err) {
      console.error('Error deleting address:', err);
      dispatch(
        setStatus({
          message: 'Failed to delete address.',
          variant: 'error',
        })
      );
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await setDefaultAddress(addressId);
      dispatch(
        setStatus({
          message: 'Default address updated!',
          variant: 'success',
        })
      );

      // Refresh addresses list
      const updatedAddresses = await getAddresses();
      setAddresses(updatedAddresses || []);
    } catch (err) {
      console.error('Error setting default address:', err);
      dispatch(
        setStatus({
          message: 'Failed to set default address.',
          variant: 'error',
        })
      );
    }
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '.244rem' }}
      >
        <Spinner
          animation="border"
          role="status"
        >
          <span className="visually-hidden">Loading addresses...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <>
      <div
        className="d-flex justify-content-between align-items-center mb-4"
      >
        {!showAddForm && (
          <Button
            variant="success"
            onClick={handleShowAddForm}
            className="d-flex align-items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Add New Address
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="">
          
          <Card.Body>
            <Form onSubmit={handleSubmitAddress}>
              <div className="d-flex flex-column gap-3">

                {/* Line 1 */}
                <Form.Group>
                  <Form.Label>Address Line 1 *</Form.Label>
                  <Form.Control
                    name="line1"
                    placeholder="Address line 1"
                    value={newAddress.line1}
                    onChange={handleChangeAddress}
                    required
                  />
                </Form.Group>

                {/* Line 2 */}
                <Form.Group>
                  <Form.Label>Address Line 2 (optional)</Form.Label>
                  <Form.Control
                    name="line2"
                    placeholder="Address line 2 (optional)"
                    value={newAddress.line2}
                    onChange={handleChangeAddress}
                  />
                </Form.Group>

                {/* City + State */}
                <Row className="g-2">
                  <Col ns={6}>
                    <Form.Group>
                      <Form.Label>City *</Form.Label>
                      <Form.Control
                        name="city"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={handleChangeAddress}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col ns={6}>
                    <Form.Group>
                      <Form.Label>State *</Form.Label>
                      <Form.Select
                        name="state"
                        aria-label="Select state"
                        value={newAddress.state}
                        onChange={handleChangeAddress}
                        required
                      >
                        <option value="">Select state</option>
                        {US_STATES.map((s) => (
                          <option key={s.abbr} value={s.abbr}>
                            {s.name} ({s.abbr})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col ns={6}>
                    {/* ZIP */}
                    <Form.Group>
                      <Form.Label>ZIP Code *</Form.Label>
                      <Form.Control
                        name="zip_code"
                        placeholder="ZIP Code"
                        value={newAddress.zip_code}
                        onChange={handleChangeAddress}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col ns={6}>
                    {/* Country */}
                    <Form.Group>
                      <Form.Label>Country *</Form.Label>
                      <Form.Control
                        name="country"
                        placeholder="Country"
                        value={newAddress.country}
                        onChange={handleChangeAddress}
                        required
                        />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Buttons */}
              <div className="d-flex gap-2 mt-3">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={saving}
                  className="d-flex align-items-center gap-2"
                >
                  {saving && (
                    <Spinner animation="border" size="sm" />
                  )}
                  {saving ? 'Saving...' : 'Save Address'}
                </Button>

                <Button variant="outline-secondary" type="button" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </Form>

          </Card.Body>
        </Card>
      )}

      {addresses?.length > 0 ? (
        <Row className="g-3 mb-4">
          {addresses.map((address, index) => (
            <Col
              md={6}
              lg={4}
              key={address.id || index}
            >
              <Card className="h-100 position-relative">
                {address.is_default && (
                  <Badge
                    bg="primary"
                    className="position-absolute top-0 start-0 m-2"
                  >
                    Default
                  </Badge>
                )}

                <Card.Body>
                  <Card.Text className="mb-2">
                    <strong>{address.line1}</strong>
                    <br />
                    {address.line2 && (
                      <>
                        {address.line2}
                        <br />
                      </>
                    )}
                    {address.city}, {address.state} {address.zip_code}
                    <br />
                    {address.country}
                  </Card.Text>

                  <div className="d-flex gap-2 flex-wrap">
                    {!address.is_default && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        !showAddForm && (
          <div className="text-center py-5">
            <i className="fas fa-map-marker-alt fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">No addresses found</h5>
            <p className="text-muted">Add your first address to get started.</p>
          </div>
        )
      )}
    </>
  );
};

export default Address;
