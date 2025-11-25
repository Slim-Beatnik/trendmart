from marshmallow import fields
from extensions import BaseSchema
from models.shopping import Cart, CartItem, Order, OrderItem


class CartItemSchema(BaseSchema):
    """
    Cart Item Schema for products in shopping cart.

    Handles individual products within a user's cart with quantity validation.
    Ensures positive quantities and maintains cart integrity.

    Validation Rules:
    - Quantity must be greater than 0
    - Product ID required for cart item identification
    """
    class Meta:
        model = CartItem
        include_fk = True
    product_id = fields.Int(required=True)
    quantity = fields.Int(required=True, validate=lambda n: n > 0)
    # Expose price snapshot stored on cart item
    price_per_unit = fields.Float(dump_only=True)
    # Convenience fields for frontend display
    product_name = fields.Method('get_product_name', dump_only=True)
    product_image_url = fields.Method('get_product_image_url', dump_only=True)

    def get_product_name(self, obj):
        try:
            return getattr(obj.product, 'name', None)
        except Exception:
            return None

    def get_product_image_url(self, obj):
        try:
            return getattr(obj.product, 'image_url', None)
        except Exception:
            return None


class CartSchema(BaseSchema):
    """
    Shopping Cart Schema for user cart management.

    Handles user shopping cart data with nested cart items.
    Maintains cart state between user sessions.

    Features:
    - Nested cart items for complete cart view
    - User association for cart ownership
    - Cart persistence across sessions
    """
    class Meta:
        model = Cart
        include_fk = True
    items = fields.Nested(CartItemSchema, many=True, dump_only=True)
    user_id = fields.Int(required=True)


class OrderItemSchema(BaseSchema):
    """
    Order Item Schema for completed order products.

    Handles individual products within completed orders.
    Preserves historical pricing and quantity data for accounting.

    Historical Data:
    - Price snapshot at time of order
    - Quantity purchased (immutable)
    - Product reference (nullable for deleted products)
    """
    class Meta:
        model = OrderItem
        include_fk = True
    product_id = fields.Int(required=True)
    quantity = fields.Int(required=True)
    price = fields.Float(required=True)


class OrderSchema(BaseSchema):
    """
    Order Schema for completed purchase orders.

    Handles order data with pricing snapshots and status tracking.
    Provides immutable historical record of transactions.

    Financial Data:
    - Subtotal, tax, and final total (frozen at order time)
    - Order status for fulfillment tracking
    - Nested order items with historical pricing

    Features:
    - Order history preservation
    - Status tracking (pending, processing, shipped, etc.)
    - Complete order details for customer service
    """
    class Meta:
        model = Order
        include_fk = True
    items = fields.Nested(OrderItemSchema, many=True, dump_only=True)
    user_id = fields.Int(required=True)
    status = fields.Str(dump_only=True)
    subtotal = fields.Float(dump_only=True)
    tax_total = fields.Float(dump_only=True)
    total = fields.Float(dump_only=True)
    placed_at = fields.DateTime(dump_only=True)


class CartCreateSchema(BaseSchema):
    """
    Cart Creation Schema for new user carts.

    Used when initializing a new shopping cart for a user.
    Excludes auto-generated fields and cart items.

    Typically used during:
    - User registration (auto-cart creation)
    - First-time cart access
    - Cart reset operations
    """
    class Meta:
        model = Cart
        # Cart does not have created_at/updated_at fields; exclude real analytics + rel fields
        exclude = ('id', 'cart_created_at', 'abandoned_flag',
                   'last_updated_at', 'items')
    user_id = fields.Int(required=True)


class CartItemCreateSchema(BaseSchema):
    """
    Cart Item Creation Schema for adding products to cart.

    Handles adding new products to user's shopping cart with validation.
    Captures price snapshot for consistency during checkout.

    Validation Rules:
    - Quantity must be positive (> 0)
    - Price must be non-negative (>= 0)
    - Product ID required for item identification

    Business Logic:
    - Price snapshot prevents checkout discrepancies
    - Quantity validation ensures valid cart state
    """
    class Meta:
        model = CartItem
        # CartItem has no created_at/updated_at columns
        exclude = ('id', 'cart_id')
    product_id = fields.Int(required=True)
    quantity = fields.Int(required=True, validate=lambda n: n > 0)
    price_per_unit = fields.Float(required=True, validate=lambda p: p >= 0)


class OrderCreateSchema(BaseSchema):
    """
    Order Creation Schema for converting cart to order.

    Used when user proceeds to checkout and converts cart to order.
    Excludes calculated fields that are computed during order processing.

    Order Processing:
    - Financial calculations handled by business logic
    - Status automatically set to 'pending'
    - Timestamps auto-generated
    - Order items created separately from cart items

    Required Fields:
    - user_id: Associates order with user account
    """
    class Meta:
        model = Order
        exclude = ('id', 'status', 'subtotal', 'tax_total',
                   'total', 'placed_at', 'items', 'payment')
    user_id = fields.Int(required=True)


class OrderItemCreateSchema(BaseSchema):
    """
    Order Item Creation Schema for order line items.

    Used during order processing to create individual order items.
    Captures historical pricing and product information for accounting.

    Validation Rules:
    - Quantity must be positive (> 0)
    - Price must be non-negative (>= 0) 
    - Product ID required for item identification

    Historical Preservation:
    - Price snapshot preserves exact amount paid
    - Quantity records exact units purchased
    - Immutable once order is placed
    """
    class Meta:
        model = OrderItem
        exclude = ('id', 'order_id')
    product_id = fields.Int(required=True)
    quantity = fields.Int(required=True, validate=lambda n: n > 0)
    price_per_unit = fields.Float(required=True, validate=lambda p: p >= 0)
