function ContactInfo() {

  return (
    <Form
                    className="mt-3"
                    onSubmit={handleSubmit}
                  >
                    <Form.Group
                      className="mb-3"
                      controlId="firstName"
                    >
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        value={contactInfo.first_name}
                        onChange={handleChange}
                        placeholder="Enter first name"
                      />
                    </Form.Group>

                    <Form.Group
                      className="mb-3"
                      controlId="lastName"
                    >
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="last_name"
                        value={contactInfo.last_name}
                        onChange={handleChange}
                        placeholder="Enter last name"
                      />
                    </Form.Group>

                    <Form.Group
                      className="mb-3"
                      controlId="phone"
                    >
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
  )
}

export default ContactInfo;