import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { loginUser, createUser } from '@redux/auth/authSlice';
import { setStatus, clearStatus } from '@redux/status/statusSlice';
import TextInput from '@children/input/TextInput';
import PasswordRequirements from './PasswordRequirements';
import PopupCloseButton from '@children/button/CloseButton';
import { useTheme } from '@resources/themes/themeContext';
import PasswordVisibleButton from './PasswordVisibleButton';

function LoginRegister({ setPopup }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    verification: '',
  });
  const [toggleForm, setToggleForm] = useState('login');
  const [passHidden, setPassHidden] = useState(true);

  const dispatch = useDispatch();
  const { theme } = useTheme();

  const handleChange = (event) => {
    const { id, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const validEmail = () => /.+@.+[.](.+){2,4}/.test(formData.email);

  const validatePassword = () => {
    const pass = formData.password;
    const errors = [];
    if (pass.length < 8) errors.push('At least 8 characters');
    if (pass.length > 50) errors.push('At most 50 characters');
    if (!/[a-z]/.test(pass)) errors.push('One lowercase letter');
    if (!/[A-Z]/.test(pass)) errors.push('One uppercase letter');
    if (!/\d/.test(pass)) errors.push('One number');
    if (!/[!@#$%^&*(),.?":{  }|<>]/.test(pass))
      errors.push('One special character');
    return errors;
  };

  const handleSubmit = async (e) => {
    // prevent default or url path will change unnecessarily
    e.preventDefault();
    // dismiss previous alert if any
    dispatch(clearStatus());
    // validate email
    if (!validEmail()) {
      dispatch(
        setStatus({ message: 'Invalid email format.', variant: 'error' })
      );
      return;
    }
    // return password criteria errors
    const errors = validatePassword();
    if (errors.length && toggleForm === 'register') {
      dispatch(
        setStatus({
          message: `Unmet password criteria: ${errors.join(', ')}.`,
        })
      );
      return;
    }
    // take email and password from formData
    const authData = {
      email: formData.email.toLowerCase(),
      password: formData.password,
    };
    if (toggleForm === 'login') {
      const result = await dispatch(loginUser(authData)).unwrap();
      console.log('Login successful:', result);
      setPopup(null);
    } else {
      const result = await dispatch(createUser(authData)).unwrap();
      console.log('Registration successful:', result);
      setPopup(null);
    }
  };

  return (
    <Col
      className="d-inline-flex flex-column flex-sm-grow-0 position-relative justify-content-between align-items-center gap-1 px-2 py-4 m-auto"
      style={{
        minHeight: '394px',
        minWidth: '288px',
        ...theme.schemes.darkText,
        borderRadius: theme.props.bR_less,
        filter: 'drop-shadow(.5rem .5rem 1rem #0a1f44e8)',
      }}
    >
      <PopupCloseButton onClick={() => setPopup(null)} />
      <h1 className="text-center">
        {toggleForm === 'login' ? 'Login' : 'Register'}
      </h1>
      <Form
        id={`${toggleForm}Form`}
        className="h-100 w-100 d-flex flex-column gap-1 justify-content-center align-items-center my-auto"
        onSubmit={handleSubmit}
      >
        <Row className="h-100 justify-content-center">
          <Col
            className="d-flex flex-column gap-1"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <TextInput
              inputId="email"
              label={toggleForm}
              title="Email"
              placeholder="Email"
              onChange={handleChange}
            />

            {toggleForm === 'register' && (
              <TextInput
                inputId="verification"
                title="Verify Email"
                placeholder="Re-enter email"
                disabled={formData.email.length === 0}
                onChange={handleChange}
              />
            )}

            <TextInput
              inputId="password"
              title="Password"
              label={toggleForm}
              placeholder="Password"
              info={toggleForm === 'register' ? '' : ''}
              password={passHidden}
              onChange={handleChange}
            >
              <Button
                onClick={() => setPassHidden(!passHidden)}
                style={{
                  backgroundColor: theme.colors.emphasis,
                  fontSize: '.6rem',
                  lineHeight: '1rem',
                  padding: 0,
                  margin: 0,
                  textDecoration: 'none',
                }}
              >
                <PasswordVisibleButton show={!passHidden} />
              </Button>
            </TextInput>

            {toggleForm === 'register' && (
              <PasswordRequirements password={formData.password} />
            )}
          </Col>
        </Row>
        <Row >

            <p
              className="mx-auto my-0 p-0"
              style={{ fontSize: '.8rem' }}
              >
              {toggleForm === 'register'
                ? 'Have an account? '
                : 'New to TrendMart? '}
              <Link
                onClick={() =>
                  setToggleForm(toggleForm === 'login' ? 'register' : 'login')
                }
                style={{ cursor: 'pointer' }}
                >
                {toggleForm === 'login' ? 'Register' : 'Login '}
              </Link>
            </p>
        <Button
          type="submit"
          className="w-50 align-self-center fw-bold border-1 align-self-end"
          style={{
            ...(toggleForm === 'login'
              ? theme.buttons.contrast
              : theme.buttons.splash),
            }}
            disabled={
              formData.email === '' ||
              formData.password.length < 8 ||
              (toggleForm === 'register' &&
                formData.verification !== formData.email)
              }
              >
          {toggleForm === 'login' ? 'Login' : 'Register'}
        </Button>
        </Row>
      </Form>
    </Col>
  );
}

export default LoginRegister;
