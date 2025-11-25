from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from schemas.shopping import (CartItemSchema, CartItemCreateSchema)
from extensions import db
from models.shopping import Cart, CartItem
from models.catalog import Product, Inventory
from models.registration import User
from marshmallow import ValidationError
import logging
import traceback

# Define Blueprint
cart_bp = Blueprint('cart', __name__, url_prefix='/cart')

# Cart Routes
# Add item to cart; create cart if one does not exist


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


@cart_bp.route('/items/<int:item_id>', methods=['POST'])
@jwt_required()
def add_item_to_cart(item_id):
    log = logging.getLogger('cart')
    try:
        try:
            current_user_id = _resolve_user_id()
        except Exception:
            return jsonify({"error": "invalid_identity"}), 401

        product = Product.query.get(item_id)
        if not product:
            return jsonify({"message": "Product not found"}), 404

        inventory = Inventory.query.filter_by(product_id=item_id).first()
        if not inventory:
            inventory = Inventory(product_id=item_id,
                                  quantity=100, restock=False)
            db.session.add(inventory)

        payload = request.get_json() or {}
        quantity = payload.get('quantity', 1)
        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return jsonify({"message": "quantity must be an integer"}), 400
        if quantity <= 0:
            return jsonify({"message": "quantity must be > 0"}), 400
        if inventory.quantity < quantity:
            return jsonify({"message": "Insufficient stock"}), 400

        item_data = {
            'product_id': item_id,
            'quantity': quantity,
            'price_per_unit': float(product.price) if product.price is not None else 0.0
        }
        try:
            validated_data = CartItemCreateSchema().load(item_data)
        except ValidationError as err:
            return jsonify(err.messages), 400

        cart = Cart.query.filter_by(user_id=current_user_id).first()
        if not cart:
            cart = Cart(user_id=current_user_id)
            db.session.add(cart)
            db.session.flush()

        cart_item = CartItem.query.filter_by(
            cart_id=cart.id, product_id=item_id).first()
        if cart_item:
            cart_item.quantity += quantity
        else:
            cart_item = CartItem(
                cart_id=cart.id,
                product_id=item_id,
                quantity=validated_data['quantity'],
                price_per_unit=validated_data['price_per_unit']
            )
            db.session.add(cart_item)

        db.session.commit()
        return jsonify(CartItemSchema().dump(cart_item)), 201
    except Exception as e:
        db.session.rollback()
        log.error("add_item_to_cart failed: %s\n%s", e, traceback.format_exc())
        return jsonify({"message": "Failed to add item to cart", "error": str(e)[:300]}), 500

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

# Delete all items in a cart (legacy query param endpoint)


@cart_bp.route('', methods=['DELETE'])
def clear_cart_legacy():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"message": "user_id query parameter is required"}), 400
    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        return jsonify({"message": "user_id must be an integer"}), 400
    cart = Cart.query.filter_by(user_id=user_id_int).first()
    if not cart:
        return jsonify({"message": "Cart cleared"}), 200
    CartItem.query.filter_by(cart_id=cart.id).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({"message": "Cart cleared"}), 200

# New: GET /cart/ uses JWT identity


@cart_bp.route('/', methods=['GET'])
@cart_bp.route('', methods=['GET'])
@jwt_required()
def get_cart():
    try:
        current_user_id = _resolve_user_id()
    except Exception:
        return jsonify({"error": "invalid_identity"}), 401
    cart = Cart.query.filter_by(user_id=current_user_id).first()
    if not cart:
        return jsonify({"items": []}), 200
    cart_items = CartItem.query.filter_by(cart_id=cart.id).all()
    item_schema = CartItemSchema(many=True)
    return jsonify({"items": item_schema.dump(cart_items)}), 200

# New: DELETE /cart/clear clears authenticated user's cart


@cart_bp.route('/clear', methods=['DELETE'])
@cart_bp.route('/clear/', methods=['DELETE'])
@jwt_required()
def clear_cart():
    try:
        current_user_id = _resolve_user_id()
    except Exception:
        return jsonify({"error": "invalid_identity"}), 401
    cart = Cart.query.filter_by(user_id=current_user_id).first()
    if not cart:
        return jsonify({"message": "Cart cleared"}), 200
    CartItem.query.filter_by(cart_id=cart.id).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({"message": "Cart cleared"}), 200

# Update item quantity in cart
    cart_item = CartItem.query.filter_by(
        cart_id=cart.id, product_id=item_id).first()


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
        db.session.delete(cart_item)
        db.session.commit()
        return jsonify({"message": "Item removed from cart"}), 200
    cart_item.quantity = quantity
    db.session.commit()
    return jsonify(CartItemSchema().dump(cart_item)), 200
