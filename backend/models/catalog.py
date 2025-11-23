from extensions import db
from .serializers import product_to_dict
from sqlalchemy import CheckConstraint, UniqueConstraint

# Note: Removed product_categories association table as products now belong to subcategories
# which are linked to main categories. This provides a cleaner hierarchy:
# Product → Subcategory → Category


class Category(db.Model):
    """
    Product Category Model

    Represents product categories for organizing products in the catalog.
    Categories can have multiple products and products can belong to multiple categories.

    Attributes:
        id (int): Primary key, auto-incrementing category identifier
        name (str): Unique category name for display (max 100 chars)
        slug (str): URL-friendly version of name, unique and indexed for SEO
    """
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)

    # Relationships
    subcategories = db.relationship('Subcategory', back_populates='category')


class Product(db.Model):
    """
    Product Model

    Core model representing products in the e-commerce catalog.
    Contains all essential product information and relationships.

    Attributes:
        id (int): Primary key, unique product identifier
        sku (str): Stock Keeping Unit, unique product code for inventory
        name (str): Product display name, indexed for search performance
        description (str): Detailed product description, unlimited text
        price (float): Product price in default currency, required field
        product_img (str): URL/path to main product image
        times_click_on (int): Analytics counter for product page views
        tags (str): Comma-separated tags for search and filtering
    """
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(250), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=True, index=True)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(500))
    image_thumb_url = db.Column(db.String(500))
    image_attribution = db.Column(db.String(255))
    times_click_on = db.Column(db.Integer, default=0, nullable=False)
    tags = db.Column(db.String(255))
    # Original external/source dataset ID (optional). Allows resolving products by sample file ID.
    source_id = db.Column(db.Integer, index=True, nullable=True)

    # Relationships
    # One-to-many: Product can have multiple reviews, delete reviews if product deleted
    reviews = db.relationship(
        'Review', back_populates='product', cascade='all, delete-orphan')

    # One-to-one: Each product has one inventory record, delete inventory if product deleted
    inventory = db.relationship(
        'Inventory', back_populates='product', uselist=False, cascade='all, delete-orphan')

    # One-to-many: Product can be in multiple carts (no cascade - preserve cart history)
    cart_items = db.relationship('CartItem', back_populates='product')

    # One-to-many: Product can be in multiple orders (no cascade - preserve order history)
    order_items = db.relationship('OrderItem', back_populates='product')

    # One-to-many: Product can have multiple recommendation scores
    recommendations = db.relationship(
        'Recommendation', back_populates='product')
    # One-to-many: Product can have multiple views
    views = db.relationship('ProductView', back_populates='product')

    subcategory_id = db.Column(db.Integer, db.ForeignKey(
        'subcategories.id'), nullable=False)
    subcategory = db.relationship('Subcategory', back_populates='products')

    def to_dict(self):
        """Return a JSON-serializable dict of this Product for the vector store.

        Delegates to the shared helper in `product_serialization.py` so the
        serialization logic can live in one place and be reused by the
        indexer or tests.
        """
        return product_to_dict(self)


class Inventory(db.Model):
    """
    Inventory Management Model

    Tracks stock levels and restock status for products.
    One-to-one relationship with Product (each product has one inventory record).

    Attributes:
        product_id (int): Primary key and foreign key to Product
        quantity (int): Current stock level, defaults to 0
        restock (bool): Flag indicating if product needs restocking
    """
    __tablename__ = 'inventory'

    product_id = db.Column(
        db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), primary_key=True)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    restock = db.Column(db.Boolean, default=False, nullable=False)

    # Relationships
    product = db.relationship('Product', back_populates='inventory')


class Review(db.Model):
    """
    Product Review Model

    Stores customer reviews and ratings for products.
    Enforces business rules: one review per user per product, rating 0-5 scale.

    Attributes:
        id (int): Primary key, unique review identifier
        product_id (int): Foreign key to Product, indexed for performance
        user_id (int): Foreign key to User, indexed for performance  
        rating (float): Numerical rating between 0-5 (enforced by constraint)
        title (str): Review headline/summary (max 500 chars)
        comment (str): Detailed review text, unlimited length
        created_on (datetime): Timestamp when review was created

    Constraints:
        - Rating must be between 0 and 5 (database constraint)
        - One review per user per product (unique constraint)
    """
    __tablename__ = 'reviews'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey(
        "products.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = db.Column(db.Float, nullable=False)
    title = db.Column(db.String(500), nullable=False)
    comment = db.Column(db.Text)
    created_on = db.Column(db.DateTime, default=db.func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint('rating >= 0 AND rating <= 5',
                        name='ck_review_rating_0_5'),
        UniqueConstraint('product_id', 'user_id',
                         name='uq_review_product_user')
    )

    # Relationships
    product = db.relationship('Product', back_populates='reviews')
    user = db.relationship('User', back_populates='reviews')


class Subcategory(db.Model):
    """
    Product Subcategory Model

    Represents subcategories under main product categories for finer organization.
    Each subcategory belongs to one main category and can have multiple products.

    Attributes:
        id (int): Primary key, auto-incrementing subcategory identifier
        name (str): Name of the subcategory
        slug (str): URL-friendly version of name, unique and indexed for SEO
        category_id (int): Foreign key to the main category
    """
    __tablename__ = 'subcategories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey(
        'categories.id'), nullable=False)

    # Relationships
    category = db.relationship('Category', back_populates='subcategories')
    products = db.relationship('Product', back_populates='subcategory')
