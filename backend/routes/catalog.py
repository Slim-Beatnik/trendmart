from extensions import db
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError
from models.catalog import Category, Inventory, Product, Review, Subcategory
from models.registration import User
from schemas.catalog import (
    CategorySchema,
    InventorySchema,
    ProductSchema,
    ReviewSchema,
    SubcategorySchema,
)
from sqlalchemy import delete, select
from werkzeug.security import generate_password_hash

# Define Blueprints
categories_bp = Blueprint('categories', __name__, url_prefix='/categories')
products_bp = Blueprint('products', __name__, url_prefix='/products')
subcategories_bp = Blueprint(
    'subcategories', __name__, url_prefix='/subcategories')

# Product Routes
# Create a new product


@products_bp.route('', methods=['POST'])
def create_product():
    try:
        product_data = request.get_json()
        product_schema = ProductSchema()
        product = product_schema.load(product_data, session=db.session)
        db.session.add(product)
        db.session.commit()
        return jsonify(product_schema.dump(product)), 201
    except ValidationError as err:
        return jsonify(err.messages), 400

# Get all products


@products_bp.route('', methods=['GET'])
def get_products():
    products = Product.query.all()
    product_schema = ProductSchema(many=True)
    return jsonify(product_schema.dump(products)), 200

# Get a single product by id


@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"message": "Product not found"}), 404
    product_schema = ProductSchema()
    return jsonify(product_schema.dump(product)), 200

# Lookup by original source_id (sample dataset id) if present


@products_bp.route('/source/<int:source_id>', methods=['GET'])
def get_product_by_source(source_id):
    product = Product.query.filter_by(source_id=source_id).first()
    if not product:
        return jsonify({"message": "Product not found"}), 404
    return jsonify(ProductSchema().dump(product)), 200

# Update a product


@products_bp.route('/<int:product_id>', methods=['PATCH'])
def update_product(product_id):
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({"message": "Product not found"}), 404

        product_data = request.get_json() or {}
        # Allow partial updates
        product_schema = ProductSchema(partial=True)
        # Load into existing instance to update fields
        updated_product = product_schema.load(
            product_data, instance=product, session=db.session, partial=True)
        db.session.add(updated_product)
        db.session.commit()
        return jsonify(product_schema.dump(updated_product)), 200
    except ValidationError as err:
        return jsonify(err.messages), 400

# Delete a product


@products_bp.route('/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"message": "Product not found"}), 404
    # Remove and commit
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted"}), 200


# Category Routes
# List all categories
@categories_bp.route('', methods=['GET'])
def list_categories():
    categories = Category.query.all()
    schema = CategorySchema(many=True)
    return jsonify(schema.dump(categories)), 200

# Get products by category


@categories_bp.route('/<int:category_id>/products', methods=['GET'])
def get_products_by_category(category_id):
    """Return products that belong to the given category via Subcategory relation.

    Note: Product does not have a direct category_id. We must join through
    Subcategory (Product.subcategory_id -> Subcategory.id -> Category.id).
    """
    products = (
        Product.query
        .join(Subcategory, Product.subcategory_id == Subcategory.id)
        .filter(Subcategory.category_id == category_id)
        .all()
    )
    product_schema = ProductSchema(many=True)
    return jsonify(product_schema.dump(products)), 200

# List subcategories for a given category


@categories_bp.route('/<int:category_id>/subcategories', methods=['GET'])
def list_subcategories(category_id):
    subs = Subcategory.query.filter_by(category_id=category_id).all()
    schema = SubcategorySchema(many=True)
    return jsonify(schema.dump(subs)), 200


# Subcategory Routes
@subcategories_bp.route('/<int:subcategory_id>/products', methods=['GET'])
def get_products_by_subcategory(subcategory_id):
    products = Product.query.filter_by(subcategory_id=subcategory_id).all()
    product_schema = ProductSchema(many=True)
    return jsonify(product_schema.dump(products)), 200


# Inventory Routes
# Get current stock of a product
@products_bp.route('/<int:product_id>/inventory', methods=['GET'])
def get_product_inventory(product_id):
    inventory = Inventory.query.filter_by(product_id=product_id).first()
    if not inventory:
        return jsonify({"message": "Inventory not found"}), 404
    inventory_schema = InventorySchema()
    return jsonify(inventory_schema.dump(inventory)), 200

# Review Routes
# Add a review for a product


@products_bp.route('/<int:product_id>/reviews', methods=['POST', 'PATCH'])
@jwt_required()
def add_product_review(product_id):

    current_user_id = int(get_jwt_identity())
    review_data = request.get_json()

    # Validate input data before any database operations
    if not review_data:
        return jsonify({"error": "No review data provided"}), 400

    if 'rating' not in review_data:
        return jsonify({"error": "Rating is required"}), 400

    rating = review_data.get('rating')
    if rating is None:
        return jsonify({"error": "Rating is required"}), 400
    if not isinstance(rating, (int, float)):
        return jsonify({"error": "Rating must be a number"}), 400
    if rating < 0 or rating > 5:
        return jsonify({"error": "Rating must be between 0 and 5"}), 400

    title = review_data.get('title')
    comment = review_data.get('comment')

    try:
        # Check if user exists
        user = User.query.filter_by(id=current_user_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Check if product exists
        product = Product.query.get(product_id)
        if not product:
            return jsonify({"error": "Product not found"}), 404

        existing_review = Review.query.filter_by(
            user_id=current_user_id,
            product_id=product_id
        ).first()

        if existing_review:
            # Update existing review
            existing_review.rating = rating
            if title is not None:
                existing_review.title = title
            if comment is not None:
                existing_review.comment = comment

            db.session.commit()
            review_schema = ReviewSchema()
            return jsonify({
                'message': 'Review updated',
                'review': review_schema.dump(existing_review)
            }), 200
        else:

            new_review = Review(
                user_id=current_user_id,
                product_id=product_id,
                rating=rating,
                title=title,
                comment=comment
            )

            db.session.add(new_review)
            db.session.commit()
            review_schema = ReviewSchema()
            return jsonify({
                'message': 'Review created',
                'review': review_schema.dump(new_review)
            }), 201
    except Exception as e:
        return jsonify({"error": "internal_server_error", "message": "An unexpected error occurred."}), 500

# Get all reviews for a product


@products_bp.route('/<int:product_id>/reviews', methods=['GET'])
def get_product_reviews(product_id):
    # Check product exists
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    reviews = Review.query.filter_by(product_id=product_id).all()
    review_schema = ReviewSchema(many=True)
    return jsonify(review_schema.dump(reviews)), 200

# Get current user's reviews for a product


@products_bp.route('/<int:product_id>/reviews/my-reviews', methods=['GET'])
@jwt_required()
def get_my_review(product_id):

    current_user_id = int(get_jwt_identity())

    # Check product exists
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    # Check review exists
    review = Review.query.filter_by(
        product_id=product_id, user_id=current_user_id).first()
    review_schema = ReviewSchema()

    return jsonify(review_schema.dump(review)), 200

# Update existing review for a product


@products_bp.route('/<int:product_id>/reviews/<int:review_id>', methods=['PATCH'])
@jwt_required()
def update_product_review(product_id, review_id):
    try:

        current_user_id = int(get_jwt_identity())

        # Check product exists
        product = Product.query.get(product_id)
        if not product:
            return jsonify({"error": "Product not found"}), 404

        # Check review exists
        review = Review.query.filter_by(
            id=review_id, product_id=product_id, user_id=current_user_id).first()
        if not review:
            return jsonify({"error": "Review not found"}), 404

        review_data = request.get_json()
        if not review_data:
            return jsonify({"error": "No review data provided"}), 400

        # Basic validation for required fields
        if 'rating' in review_data:
            rating = review_data.get('rating')
            if rating is None:
                return jsonify({"error": "Rating is required"}), 400
            if rating < 0 or rating > 5:
                return jsonify({"error": "Rating must be between 0 and 5"}), 400
            review.rating = rating

        if 'title' in review_data:
            review.title = review_data.get('title')
        if 'comment' in review_data:
            review.comment = review_data.get('comment')

        db.session.commit()
        review_schema = ReviewSchema()
        return jsonify({
            'message': 'Review updated',
            'review': review_schema.dump(review)
        }), 200

    except ValidationError as err:
        return jsonify(err.messages), 400

# Delete a review for a product


@products_bp.route('/<int:product_id>/reviews/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_product_review(product_id, review_id):
    current_user_id = int(get_jwt_identity())

    # Check review exists
    review = Review.query.filter_by(
        id=review_id, product_id=product_id, user_id=current_user_id).first()
    if not review:
        return jsonify({"error": "Review not found"}), 404

    # Check product exists
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    db.session.delete(review)
    db.session.commit()
    return jsonify({"message": "Review deleted"}), 200

# Get average rating and count


@products_bp.route('/<int:product_id>/rating_summary', methods=['GET'])
def get_review_summary(product_id):

    # Check product exists
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    # Check for reviews
    reviews = Review.query.filter_by(product_id=product_id).all()
    # if not reviews:
    #     return jsonify({"average_rating": 0, "review_count": 0}), 200

    # Calculate average rating and count
    total_rating = sum(review.rating for review in reviews)
    average_rating = total_rating / len(reviews)
    review_count = len(reviews)

    return jsonify({
        "product:": ProductSchema().dump(product),
        "average_rating": round(average_rating, 2),
        "count": review_count
    }), 200
