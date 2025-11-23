import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment from backend/.env explicitly, then fall back to current working dir
_here = os.path.dirname(__file__)
_backend_env = os.path.join(_here, '.env')
if os.path.exists(_backend_env):
    load_dotenv(_backend_env)
else:
    load_dotenv()

# Optionally load Stripe-specific env file if present, to override keys securely
_backend_env_stripe = os.path.join(_here, '.env.stripe')
if os.path.exists(_backend_env_stripe):
    load_dotenv(_backend_env_stripe, override=True)


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL') or 'sqlite:///trendmart.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
    STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY')
    STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
