import { useTheme } from '@resources/themes/themeContext';

function Security() {
  const { theme } = useTheme();

  return (
    <>
      <h4>Security Settings</h4>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Current Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter current password"
          />
        </Form.Group>
        <Form.Group className="">
          <Form.Label>New Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter new password"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Confirm New Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Confirm new password"
          />
        </Form.Group>
        <Button
          type="submit"
          style={{ backgroundColor: theme.color.emphasis }}
        >
          Change Password
        </Button>
      </Form>
    </>
  );
}

export default Security;
