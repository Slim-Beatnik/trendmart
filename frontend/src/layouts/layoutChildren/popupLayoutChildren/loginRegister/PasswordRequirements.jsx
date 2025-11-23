import { ListGroup } from 'react-bootstrap';

function PasswordRequirements({ password }) {
  const requirements = [
    { test: /^.{8,50}$/, text: '8–50 characters long' },
    { test: /[a-z]/, text: 'At least one lowercase letter' },
    { test: /[A-Z]/, text: 'At least one uppercase letter' },
    { test: /\d/, text: 'At least one number' }, // unicode of symbols in next test
    {
      test: /[!@#$%^&*(),.?":{}|<>]/,
      text: 'At least one symbol: \u0021\u0040\u0023\u0024\u0025\u005E\u0026\u002A\u0028\u0029\u002E\u003F\u0022\u003A\u007B\u007D\u007C\u003C\u003E',
    },
  ];

  return (
    <ListGroup
      className="p-0 pb-1"
      variant="flush"
      style={{ fontSize: '1.5vmax' }}
    >
      {requirements.map((req, index) => {
        const passed = req.test.test(password);

        return (
          <ListGroup.Item
            className="d-flex align-items-center p-0"
            key={index}
            style={{
              border: 'none',
              backgroundColor: 'inherit',
              color: passed ? 'green' : 'red',
              fontSize: '.8rem',
            }}
          >
            {(passed ? '✅' : '❌') + req.text}
          </ListGroup.Item>
        );
      })}
    </ListGroup>
  );
}

export default PasswordRequirements;
