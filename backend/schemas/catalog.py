from marshmallow import Schema, fields, validate, validates, ValidationError
from extensions import BaseSchema
from models.catalog import Product, Category, Inventory, Review, Subcategory

# -------Read and Write Schemas------- #


class CategorySchema(BaseSchema):
    """
    Category Schema for API serialization/deserialization.
    Automatically includes all Category model fields.
    """
    class Meta:
        model = Category


class SubcategorySchema(BaseSchema):
    """
    Subcategory Schema for API serialization/deserialization.
    Automatically includes all Subcategory model fields.
    """
    class Meta:
        model = Subcategory

    # Include parent category
    category = fields.Nested(CategorySchema, dump_only=True)


class ProductSchema(BaseSchema):
    """
    Product Schema for API responses.
    Includes nested subcategory and review data for complete product information.
    """
    class Meta:
        model = Product

    # Nested relationships for rich API responses (read-only)
    subcategory = fields.Nested(SubcategorySchema, dump_only=True)
    reviews = fields.Nested('ReviewSchema', many=True, dump_only=True)
    source_id = fields.Int(dump_only=True)


class InventorySchema(BaseSchema):
    """
    Inventory Schema for stock management API operations.
    Handles product inventory tracking and restock flags.
    """
    class Meta:
        model = Inventory


class ReviewSchema(BaseSchema):
    """
    Review Schema with custom validation for rating field.
    Enforces business rule: ratings must be between 0-5.
    """
    class Meta:
        model = Review

    # Custom validation for rating field (supplements database constraint)
    @validates('rating')
    def validate_rating(self, value):
        """Ensure rating is within valid range (0-5 stars)"""
        if value < 0 or value > 5:
            raise ValidationError('Rating must be between 0 and 5')

# -------Input Schemas------- #


class ProductCreateSchema(BaseSchema):
    """
    Product Creation Schema with validation rules.

    Excludes auto-generated fields and provides subcategory assignment via ID.
    Implements business validation rules for product data integrity.
    """
    class Meta:
        model = Product
        # Exclude auto/relationship fields
        exclude = ('id', 'subcategory', 'reviews')

    # Subcategory assignment via ID (converted to relationship in business logic)
    subcategory_id = fields.Integer(required=True, load_only=True)
    price = fields.Float(required=True, validate=validate.Range(min=0))
    name = fields.String(required=True, validate=validate.Length(min=1))
    sku = fields.String(required=True, validate=validate.Length(min=1))
    description = fields.String(validate=validate.Length(min=1))
    product_img = fields.String(validate=validate.Length(min=1))
    tags = fields.String(validate=validate.Length(min=1))


class ProductUpdateSchema(ProductCreateSchema):
    """
    Product Update Schema - inherits all validation from ProductCreateSchema.
    Same validation rules apply for updates as creates.
    """
    pass
