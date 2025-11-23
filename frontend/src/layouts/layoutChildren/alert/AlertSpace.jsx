import CloseButton from 'react-bootstrap/CloseButton';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { useDispatch } from 'react-redux';
import { clearStatus } from '@redux/status/statusSlice';
import { useTheme } from '@resources/themes/themeContext';

function AlertCloseButton({ onClick }) {
  return (
    <CloseButton
      onClick={onClick}
    />
  );
}

function AlertSpace({ alertMessage, variant }) {
  const { theme } = useTheme();
  const dispatch = useDispatch();

  return (
    <Col
      className="h-100 m-0 p-0 w-100 justify-content-center align-items-center position-relative"
      style={{
        height: '6vh',
        display: 'flex',
        color: theme.colors.contrast,
        backgroundColor: theme.alerts[variant],
        borderRadius: `0 0 ${Array(2).fill(theme.props.bR_more).join(' ')}`,
      }}
    >
      <Row className="w-100 d-flex flex-row">
        <Col className="justify-content-center align-items-center p-0 my-0 ps-4 d-flex">
          <div
            style={{
              ...theme.schemes.darkText,
              borderRadius: theme.props.bR_less,
              padding: '.5rem',
            }}
          >
            {alertMessage}
          </div>
        </Col>
        <Col className='d-flex flex-column flex-grow-0 justify-content-center align-items-center p-0 pe-1'>
          <AlertCloseButton onClick={() => dispatch(clearStatus())} />
        </Col>
      </Row>
    </Col>
  );
}

export default AlertSpace;
