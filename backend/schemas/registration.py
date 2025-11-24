from marshmallow import fields, validate
from extensions import BaseSchema
from models.registration import User, CustomerProfile, Address
from . import PASSWORD_VALIDATOR


class AddressSchema(BaseSchema):
    """
    Address Schema for shipping and billing addresses.

    Handles user address data for orders and customer profiles.
    Includes all address components with proper validation.
    """
    class Meta:
        model = Address


class CustomerProfileSchema(BaseSchema):
    """
    Customer Profile Schema for extended user information.

    Handles customer-specific data beyond basic user account info.
    Includes nested address relationships and profile details.

    Used for:
    - Customer account management
    - Order processing (name, contact info)
    - Profile customization and preferences
    """
    class Meta:
        model = CustomerProfile

    default_address = fields.Nested(AddressSchema, dump_only=True)
    # Expose default_address_id for clients that need to confirm selection
    default_address_id = fields.Int(dump_only=True)


class UserSchema(BaseSchema):
    """
    User Account Schema for authentication and user data.

    Handles core user account information with security considerations.
    Excludes sensitive password hash from serialization for security.

    Security Features:
    - Password hash exclusion from API responses
    - Nested customer profile and address data
    - Role-based access control support
    """
    class Meta:
        model = User
        exclude = ("password_hash",)

    customer_profile = fields.Nested(CustomerProfileSchema, dump_only=True)
    addresses = fields.Nested(AddressSchema, many=True, dump_only=True)


class UserRegistrationSchema(BaseSchema):
    """
    User Registration Schema with security validation.

    Handles new user account creation with comprehensive validation.
    Enforces strong password requirements and secure registration process.

    Validation Rules:
    - Password: 8-50 characters with complexity requirements
    - Email: Valid email format required
    - Role: Automatically set to 'customer' for security

    Security Features:
    - Complex password validation (uppercase, lowercase, numbers, symbols)
    - Email format validation
    - Excludes sensitive fields from input
    """
    class Meta:
        model = User
        exclude = ('id', 'created_at', 'active', 'role',
                   'customer_profile', 'addresses', 'password_hash')

    password = fields.String(
        required=True,
        validate=[
            validate.Length(min=8, max=50),
            PASSWORD_VALIDATOR
        ]
    )
    role = fields.String(dump_only=True, dump_default='customer')
    email = fields.Email(required=True)


class CustomerProfileInputSchema(BaseSchema):
    """
    Customer Profile Input Schema for profile creation/updates.

    Handles customer profile data input with validation.
    Used for creating and updating customer-specific information.

    Required Fields:
    - first_name: Customer's first name (required for orders)
    - last_name: Customer's last name (required for orders)

    Excludes relationship fields that are managed separately.
    """
    class Meta:
        model = CustomerProfile
        exclude = ('id', 'user_id', 'default_address', 'user', 'addresses')
    first_name = fields.String(required=True)
    last_name = fields.String(required=True)
