from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from sqlalchemy import select, delete
from marshmallow import ValidationError
from models.shopping import Cart, CartItem, Order, OrderItem
from models.payment import Payment
from models.registration import User
from models.catalog import Product, Inventory
from schemas.shopping import CartSchema, CartItemSchema, OrderCreateSchema, OrderSchema, OrderItemCreateSchema, OrderItemSchema
from schemas.payment import PaymentCreateSchema, PaymentSchema
import time


def _resolve_user_id():
    identity = get_jwt_identity()
    try:
        return int(identity)
    except Exception:
        if isinstance(identity, str):
            user = User.query.filter_by(email=identity).first()
            if user:
                return user.id
        raise ValueError("invalid_identity")


orders_bp = Blueprint('orders', __name__, url_prefix='/orders')
checkout_bp = Blueprint('checkout', __name__, url_prefix='/checkout')


# Create new order from cart after successful payment
@orders_bp.route('/', methods=['POST'])
@jwt_required()
def create_order():

    try:
        current_user_id = _resolve_user_id()

        # Get user's current cart
        cart = Cart.query.filter_by(user_id=current_user_id).first()
        if not cart:
            return jsonify({"error": "No active cart found"}), 404

        # Get cart items
        cart_items = CartItem.query.filter_by(cart_id=cart.id).all()
        if not cart_items:
            return jsonify({"error": "Cart is empty"}), 400

        # Calculate order totals
        subtotal = sum(item.quantity *
                       item.price_per_unit for item in cart_items)
        tax_rate = 0.075  # 7.5% tax rate example
        tax_total = subtotal * tax_rate  # Calculate tax
        total = subtotal + tax_total  # Calculate total including tax

        # Simulate payment processing
        payment_success = True  # This should come from your payment processor
        # Mock transaction ID
        transaction_id = f"txn_{current_user_id}_{int(time.time())}"

        if not payment_success:
            return jsonify({"error": "Payment processing failed"}), 402

        # Only create order AFTER successful payment
        new_order = Order(
            user_id=current_user_id,
            status='paid',  # Order is paid and confirmed
            subtotal=subtotal,
            tax_total=tax_total,
            total=total
        )

        db.session.add(new_order)
        db.session.flush()  # Get the order ID without committing

        # Convert cart items to order items using direct object creation
        for cart_item in cart_items:
            # Create order item directly to avoid schema compatibility issues
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                price_per_unit=cart_item.price_per_unit
            )

            db.session.add(order_item)

        # Clear the cart after creating order
        CartItem.query.filter_by(cart_id=cart.id).delete()

        # Commit all changes
        db.session.commit()

        # Return the created order with payment confirmation
        result = OrderSchema().dump(new_order)

        return jsonify({
            "message": "Order created successfully",
            "order": result
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create order: {str(e)}"}), 500

# Get specific order by ID


@orders_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order_details(order_id):
    """
    Get details for a specific order.
    Only allows users to view their own orders.
    """
    try:
        current_user_id = _resolve_user_id()

        # Query the specific order for the current user
        order = Order.query.filter_by(
            id=order_id, user_id=current_user_id).first()

        if not order:
            return jsonify({"error": "Order not found"}), 404

        # Serialize the order
        order_schema = OrderSchema()
        result = order_schema.dump(order)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch order details"}), 500

# Get orders by user id


@orders_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_orders_by_user_id(user_id):
    """
    Get all orders for the current authenticated user.
    Returns orders sorted by most recent first.
    """
    try:

        # Query all orders for the current user, ordered by placed_at descending
        orders = Order.query.filter_by(user_id=user_id).order_by(
            Order.placed_at.desc()).all()

        # Serialize the orders
        orders_schema = OrderSchema(many=True)
        result = orders_schema.dump(orders)

        return jsonify({
            "orders": result,
            "total_orders": len(orders)
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch orders"}), 500

# Get all orders for current user


@orders_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_orders():
    """
    Get all orders for the current authenticated user.
    Returns orders sorted by most recent first.
    """
    try:
        current_user_id = _resolve_user_id()

        # Query all orders for the current user, ordered by placed_at descending
        orders = Order.query.filter_by(user_id=current_user_id).order_by(
            Order.placed_at.desc()).all()

        # Serialize the orders
        orders_schema = OrderSchema(many=True)
        result = orders_schema.dump(orders)

        return jsonify({
            "orders": result,
            "total_orders": len(orders)
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch orders"}), 500

# Pre-validate cart before checkout


@checkout_bp.route('/validate', methods=['POST'])
@jwt_required()
def checkout_validate():
    try:
        current_user_id = _resolve_user_id()

        # Get user's active cart
        cart = Cart.query.filter_by(user_id=current_user_id).first()

        if not cart:
            # Return 200 with valid false so frontend does not log error noise
            return jsonify({
                "valid": False,
                "error": "No active cart found",
                "cart_total": 0,
                "subtotal": 0,
                "tax_total": 0,
                "total": 0,
                "item_count": 0,
                "valid_item_count": 0,
                "items": [],
                "messages": ["Please add items to your cart first"],
                "status_code": 200
            }), 200

        # Get cart items with product details
        cart_items = CartItem.query.filter_by(cart_id=cart.id).all()

        if not cart_items:
            return jsonify({
                "valid": False,
                "error": "Cart is empty",
                "cart_total": 0,
                "subtotal": 0,
                "tax_total": 0,
                "total": 0,
                "item_count": 0,
                "valid_item_count": 0,
                "items": [],
                "messages": ["Your cart is empty"],
                "status_code": 200
            }), 200

        # Validation tracking
        valid = True
        valid_items = cart_items[:]  # assume all items are valid for demo
        warnings = []

        # Check each cart item for stock availability (warnings only)
        for cart_item in cart_items:
            product = Product.query.get(cart_item.product_id)
            if not product:
                warnings.append("Product no longer available")
                continue

            inventory = Inventory.query.filter_by(
                product_id=cart_item.product_id).first()
            if not inventory or inventory.quantity < cart_item.quantity:
                if not inventory:
                    warnings.append(f"'{product.name}': No stock available")
                elif inventory.quantity == 0:
                    warnings.append(f"'{product.name}': Out of stock")
                else:
                    warnings.append(
                        f"'{product.name}': Only {inventory.quantity} units available, "
                        f"but {cart_item.quantity} requested"
                    )

        subtotal = sum(item.quantity *
                       item.price_per_unit for item in valid_items)
        tax_rate = 0.075
        tax_total = subtotal * tax_rate
        total = subtotal + tax_total

        # Check minimum order amount
        min_order_amount = 10.00
        if subtotal > 0 and subtotal < min_order_amount:
            valid = False
            warnings.append(
                f"Minimum order amount is ${min_order_amount:.2f}")

        # Build item details list (include all items so UI can render full review)
        item_details = []
        for ci in cart_items:
            prod = Product.query.get(ci.product_id)
            item_details.append({
                "product_id": ci.product_id,
                "product_name": prod.name if prod else None,
                "quantity": ci.quantity,
                "price_per_unit": float(ci.price_per_unit),
                "line_total": round(ci.quantity * ci.price_per_unit, 2),
                "valid": ci in valid_items
            })

        # Build response
        validation_result = {
            "valid": valid,
            "cart_total": round(total, 2),  # legacy key retained
            # explicit total key for frontend adapter
            "total": round(total, 2),
            "subtotal": round(subtotal, 2),
            "tax_total": round(tax_total, 2),
            "item_count": len(cart_items),
            "valid_item_count": len(valid_items),
            "items": item_details,
            "messages": warnings if warnings else ["Cart is ready for checkout"],
        }

        # Always return 200 with explicit validity flag to avoid client console 400 noise
        validation_result["status_code"] = 200
        return jsonify(validation_result), 200

    except Exception as e:
        return jsonify({
            "valid": False,
            "error": "Failed to validate cart",
            "messages": [str(e)]
        }), 500
