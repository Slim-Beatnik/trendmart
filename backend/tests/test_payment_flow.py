import os
from flask_jwt_extended import create_access_token
from models.shopping import Order
from extensions import db
from app import create_app
from types import SimpleNamespace
import stripe
import json
import sys
# Ensure local backend modules (config.py) are resolved before any similarly named installed packages
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
# Force test DB to SQLite BEFORE importing app/config so Postgres URL is ignored
TEST_DB_PATH = os.path.join(os.path.dirname(__file__), 'test_payment.db')
if os.path.exists(TEST_DB_PATH):
    os.remove(TEST_DB_PATH)
os.environ['DATABASE_URL'] = f'sqlite:///{TEST_DB_PATH}'
# Ensure any alternative config import using SQLALCHEMY_DATABASE_URI picks up SQLite
os.environ['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']


class FakeCharge(SimpleNamespace):
    pass


class FakeCharges(SimpleNamespace):
    pass


class FakeIntent(SimpleNamespace):
    pass


def _fake_intent(status="requires_payment_method"):
    return FakeIntent(
        id="pi_test_123",
        client_secret="cs_test_secret",
        status=status,
        charges=FakeCharges(
            data=[FakeCharge(payment_method_details=SimpleNamespace(type="card"))])
    )


def test_payment_flow_webhook_success(monkeypatch):
    """End-to-end: create order -> create payment intent -> webhook success updates status."""
    app = create_app()
    app.config['TESTING'] = True
    # Ensure JWT secret present
    app.config['JWT_SECRET_KEY'] = app.config.get(
        'JWT_SECRET_KEY') or 'test-secret'

    with app.app_context():
        db.drop_all()
        db.create_all()

        # Create a simple order (no user required for metadata in this test)
        order = Order(user_id=None, status='pending',
                      subtotal=19.99, tax_total=0.00, total=19.99)
        db.session.add(order)
        db.session.commit()

        # Mock Stripe create to return predictable intent
        def fake_create(**kwargs):
            return _fake_intent(status="requires_confirmation")

        def fake_retrieve(intent_id):
            assert intent_id == "pi_test_123"
            return _fake_intent(status="succeeded")

        def fake_construct_event(payload, sig, secret):
            # Return a minimal succeeded event
            data = json.loads(payload)
            return {
                'type': 'payment_intent.succeeded',
                'data': {'object': {'id': data['id']}}
            }

        monkeypatch.setattr(stripe.PaymentIntent, 'create',
                            staticmethod(fake_create))
        monkeypatch.setattr(stripe.PaymentIntent, 'retrieve',
                            staticmethod(fake_retrieve))
        monkeypatch.setattr(stripe.Webhook, 'construct_event',
                            staticmethod(fake_construct_event))

        client = app.test_client()
        token = create_access_token(identity="tester")
        auth_header = {'Authorization': f'Bearer {token}'}

        # Create payment intent
        resp = client.post('/payments/intent',
                           json={'order_id': order.id}, headers=auth_header)
        assert resp.status_code == 200, resp.data
        data = resp.get_json()
        payment_id = data['payment_id']
        assert data['client_secret'] == 'cs_test_secret'

        # Simulate webhook success
        webhook_payload = json.dumps({'id': 'pi_test_123'})
        resp2 = client.post('/payments/webhook', data=webhook_payload,
                            headers={'Stripe-Signature': 't', **auth_header})
        assert resp2.status_code == 200, resp2.data

        # Fetch payment status
        status_resp = client.get(
            f'/payments/{payment_id}', headers=auth_header)
        assert status_resp.status_code == 200
        status_data = status_resp.get_json()
        assert status_data['status'] == 'completed'
        assert status_data['amount_cents'] == 1999
        # total_amount should be 19.99 derived from cents
        assert abs(status_data['total_amount'] - 19.99) < 0.001
