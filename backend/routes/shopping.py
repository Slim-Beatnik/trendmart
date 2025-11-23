from flask import Blueprint, request, jsonify
from schemas.shopping import (
    CartItemSchema,
    CartItemCreateSchema
)
from extensions import db
from models.shopping import Cart, CartItem
from models.catalog import Product, Inventory
from sqlalchemy import select, delete
from marshmallow import ValidationError

# Define Blueprint
cart_bp = Blueprint('cart', __name__, url_prefix='/cart')

# Cart Routes
# Add item to cart; create cart if one does not exist
@cart_bp.route('/items/<int:item_id>', methods=['POST'])
def add_item_to_cart(item_id):
    item_data = request.get_json() or {}
    item_data['product_id'] = item_id

    # Validate input data
    try:
        cart_item_create_schema = CartItemCreateSchema()
        validated_data = cart_item_create_schema.load(item_data)
    except ValidationError as err:
        return jsonify(err.messages), 400

    user_id = validated_data.get('user_id')
    quantity = validated_data.get('quantity')

    # Check if product exists
    product = Product.query.get(item_id)
    if not product:
        return jsonify({"message": "Product not found"}), 404

    # Check inventory
    inventory = Inventory.query.filter_by(product_id=item_id).first()
    if not inventory or inventory.stock < quantity:
        return jsonify({"message": "Insufficient stock"}), 400

    # Get or create cart for user
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.session.add(cart)
        db.session.commit()

    # Check if item already in cart
    cart_item = CartItem.query.filter_by(cart_id=cart.id, product_id=item_id).first()
    if cart_item:
        # Update quantity
        cart_item.quantity += quantity
    else:
        # Add new item to cart
        cart_item = CartItem(cart_id=cart.id, product_id=item_id, quantity=quantity)
        db.session.add(cart_item)

    db.session.commit()
    item_schema = CartItemSchema()
    return jsonify(item_schema.dump(cart_item)), 201

# Get all items in a customer's cart
@cart_bp.route('/items/<int:user_id>', methods=['GET'])
def get_cart_items(user_id):
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        return jsonify({"items": []}), 200

    cart_items = CartItem.query.filter_by(cart_id=cart.id).all()
    item_schema = CartItemSchema(many=True)
    return jsonify({"items": item_schema.dump(cart_items)}), 200

# Remove item from cart
@cart_bp.route('/items/<int:item_id>', methods=['DELETE'])
def remove_item_from_cart(item_id):
    cart_item = CartItem.query.get(item_id)
    if not cart_item:
        return jsonify({"message": "Cart item not found"}), 404

    db.session.delete(cart_item)
    db.session.commit()
    return jsonify({"message": "Item removed from cart"}), 200

# Delete all items in a cart
@cart_bp.route('', methods=['DELETE'])
def clear_cart():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"message": "user_id query parameter is required"}), 400
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return jsonify({"message": "user_id must be an integer"}), 400

    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        # Idempotent: nothing to clear
        return jsonify({"message": "Cart cleared"}), 200

    # Bulk delete cart items for this cart
    CartItem.query.filter_by(cart_id=cart.id).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({"message": "Cart cleared"}), 200

# Update item quantity in cart
@cart_bp.route('/items/<int:item_id>', methods=['PATCH'])
def update_cart_item(item_id):
    cart_item = CartItem.query.get(item_id)
    if not cart_item:
        return jsonify({"message": "Cart item not found"}), 404

    item_data = request.get_json() or {}
    if 'quantity' not in item_data:
        return jsonify({"message": "quantity is required"}), 400
    try:
        quantity = int(item_data['quantity'])
    except (TypeError, ValueError):
        return jsonify({"message": "quantity must be an integer"}), 400

    if quantity <= 0:
        # Treat zero or negative as removal
        db.session.delete(cart_item)
        db.session.commit()
        return jsonify({"message": "Item removed from cart"}), 200

    cart_item.quantity = quantity
    db.session.commit()
    item_schema = CartItemSchema()
    return jsonify(item_schema.dump(cart_item)), 200