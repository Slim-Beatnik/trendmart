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

    @staticmethod
    def _normalize_env(value: str | None) -> str | None:
        if not value:
            return None
        value = value.strip()
        if value.startswith('${') and value.endswith('}'):
            return None
        return value

    @staticmethod
    def _explicit_fake_mode_flag() -> bool:
        return os.environ.get('STRIPE_FAKE_MODE', '').strip().lower() in {
            '1', 'true', 'yes'
        }

    _stripe_secret = _normalize_env(os.environ.get('STRIPE_SECRET_KEY'))
    _stripe_publishable = _normalize_env(
        os.environ.get('STRIPE_PUBLISHABLE_KEY'))
    _stripe_webhook = _normalize_env(
        os.environ.get('STRIPE_WEBHOOK_SECRET'))

    STRIPE_SECRET_KEY = _stripe_secret
    STRIPE_PUBLISHABLE_KEY = _stripe_publishable
    STRIPE_WEBHOOK_SECRET = _stripe_webhook
    STRIPE_FAKE_MODE = _explicit_fake_mode_flag() or not bool(_stripe_secret)
