import os

import models
from config import Config
from extensions import cors, db, init_stripe, jwt, ma
from flask import Flask, jsonify, redirect, send_from_directory
from flask_swagger_ui import get_swaggerui_blueprint
from models.catalog import Category, Product, Subcategory
from routes import cold_start
from routes.admin import admin_bp
from routes.auth import auth_bp
from routes.bulk_add import bulk_bp
from routes.bulk_users import bulk_users_bp
from routes.catalog import categories_bp, products_bp, subcategories_bp
from routes.customers import customers_bp
from routes.events import events_bp, recom_feedback_bp
from routes.payment import payment_bp
from routes.shopping import order_bp
from routes import cold_start
import models
from models.catalog import Category, Subcategory, Product
from flask_swagger_ui import get_swaggerui_blueprint
import os
from routes.recommendation import recom_bp
from routes.orders import orders_bp, checkout_bp
from routes.shopping import cart_bp

# Swagger UI configuration
SWAGGER_URL = "/api/docs"
API_URL = "/api/swagger"  # Served via send_from_directory below

# Create swaggerui blueprint
swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        "app_name": "Trendmart API Documentation",
    },
)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    # Early test override: if running under pytest and DATABASE_URL is set (e.g. sqlite path), force it
    if os.environ.get('PYTEST_CURRENT_TEST') and os.environ.get('DATABASE_URL'):
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']

    # Initialize extensions (after potential test DB override)
    db.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)

    # This line is to allow CORS for all domains
    cors.init_app(
        app,
        resources={
            r"/*": {
                "origins": "*",
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True,
            },
        },
    )

    init_stripe(app)

    with app.app_context():
        try:
            db.create_all()
            # Seed initial minimal catalog if empty
            # if Product.query.count() == 0:
            #     cat = Category(name="Electronics", slug="electronics")
            #     sub = Subcategory(name="Phones", slug="phones", category=cat)
            #     prod = Product(
            #         sku="SKU-1",
            #         name="Sample Phone",
            #         description="Seed product for initial interactions",
            #         price=199.99,
            #         subcategory=sub,
            #     )
            #     db.session.add_all([cat, sub, prod])
            #     db.session.commit()
            #     print("Seeded initial catalog data (1 product).")
            print("Database tables created successfully!")
        except Exception as e:
            print(f"Database initialization error: {e}")

    # Register blueprints
    app.register_blueprint(admin_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(subcategories_bp)
    app.register_blueprint(swaggerui_blueprint)
    app.register_blueprint(recom_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(recom_feedback_bp)
    app.register_blueprint(bulk_bp)
    app.register_blueprint(bulk_users_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(order_bp)

    # Serve product/media assets from backend/assets directory
    @app.route("/assets/<path:filename>")
    def assets(filename: str):
        # Files live under backend/assets; example URL:
        #   /assets/productImages/phones/Apple_iPhone_15.avif
        return send_from_directory("assets", filename)
    app.register_blueprint(orders_bp)
    app.register_blueprint(checkout_bp)
    app.register_blueprint(cart_bp)

    # Serve the raw swagger.yaml

    @app.route("/api/swagger")
    def swagger_spec():
        return send_from_directory("documentation", "swagger.yaml")

    # Root redirect to docs
    @app.route("/")
    def home():
        return redirect("/api/docs")

    # JSON error handlers for consistent API responses
    @app.errorhandler(400)
    def handle_400(e):
        return jsonify(
            {"error": "bad_request", "message": getattr(
                e, "description", str(e))}
        ), 400

    @app.errorhandler(404)
    def handle_404(e):
        return jsonify(
            {"error": "not_found", "message": getattr(
                e, "description", str(e))}
        ), 404

    @app.errorhandler(405)
    def handle_405(e):
        return jsonify(
            {
                "error": "method_not_allowed",
                "message": getattr(e, "description", str(e)),
            }
        ), 405

    @app.errorhandler(500)
    def handle_500(e):
        return jsonify(
            {
                "error": "internal_server_error",
                "message": "An unexpected error occurred.",
            }
        ), 500

    return app


if __name__ == "__main__":
    # For local development only (not used in Docker)
    app = create_app()
    app.run(debug=True)
