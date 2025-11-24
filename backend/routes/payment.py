from flask import Blueprint, request, jsonify, current_app
import stripe
from stripe import _error as stripe_errors
from marshmallow import ValidationError

from schemas.payment import PaymentIntentCreateSchema
from extensions import db
from flask_jwt_extended import jwt_required
from utils.payment_service import PaymentService
from models.shopping import Order

# PLURAL prefix to match your desired routes
payment_bp = Blueprint('payments', __name__, url_prefix='/payments')


def _error(code: str, message: str, status: int, *, details: str | None = None, error_type: str | None = None):
    payload = {"error": code, "message": message}
    if details:
        payload["details"] = details
    if error_type:
        payload["type"] = error_type
    return jsonify(payload), status


@payment_bp.route('/config', methods=['GET'])
@jwt_required(optional=True)
def get_stripe_config():
    publishable_key = current_app.config.get('STRIPE_PUBLISHABLE_KEY')
    fake_mode = current_app.config.get('STRIPE_FAKE_MODE', False) or not bool(
        current_app.config.get('STRIPE_SECRET_KEY'))
    if fake_mode:
        # In fake mode always return a deterministic fake publishable key so frontend can initialize Stripe Elements
        return jsonify({'publishableKey': publishable_key or 'pk_test_FAKE', 'fake': True}), 200
    if not publishable_key:
        return _error('config_error', 'Stripe publishable key not configured', 500)
    return jsonify({'publishableKey': publishable_key, 'fake': False}), 200


# POST /payments/intent
@payment_bp.route('/intent', methods=['POST'])
@jwt_required()
def create_payment_intent():
    try:
        data = PaymentIntentCreateSchema().load(request.get_json(silent=True) or {})
    except ValidationError as err:
        return _error('validation_error', str(err), 400)

    order_id = data["order_id"]
    order = db.session.get(Order, order_id)
    if not order:
        return _error('order_not_found', f'Order {order_id} not found', 404)

    amount_cents = int(round((order.total or 0.0) * 100))
    if amount_cents <= 0:
        return _error('bad_request', 'Order total must be greater than 0', 400)

    try:
        result = PaymentService.create_payment_intent(
            order_id=order_id,
            amount=amount_cents,
            currency=(data.get('currency') or 'usd').lower(),
            metadata={**({'source': 'api'}), **(data.get('metadata') or {})}
        )
        return jsonify(result), 200
    except ValueError as err:
        return _error('order_not_found', str(err), 404, details=str(err), error_type=err.__class__.__name__)
    except stripe_errors.StripeError as err:
        current_app.logger.error(f"Stripe payment intent failed: {err}")
        details = getattr(err, 'user_message', None) or str(err)
        # Map Stripe errors to 400 (client/actionable) unless clearly a configuration/auth issue
        is_auth = isinstance(err, stripe_errors.AuthenticationError)
        status_code = 400 if not is_auth else 500
        return _error('stripe_error', 'Stripe API error', status_code, details=details, error_type=err.__class__.__name__)
    except Exception as err:
        current_app.logger.error(f"Unexpected payment intent error: {err}")
        return _error('internal_error', 'Unable to start payment at this time', 500, details=str(err), error_type=err.__class__.__name__)


# POST /payments/webhook
@payment_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = current_app.config.get('STRIPE_WEBHOOK_SECRET')
    if not webhook_secret:
        return _error('config_error', 'Webhook secret not configured', 500)

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret)
    except ValueError:
        return _error('invalid_payload', 'Invalid payload', 400)
    except Exception:
        return _error('invalid_signature', 'Invalid signature', 400)

    ok = PaymentService.process_webhook_event(event)
    if not ok:
        return _error('unhandled_event', 'Unhandled event type', 400)
    return jsonify({'status': 'ok'}), 200


# GET /payments/<payment_id>
@payment_bp.route('/<int:payment_id>', methods=['GET'])
@jwt_required()
def get_payment_status(payment_id: int):
    try:
        data = PaymentService.get_payment_status(payment_id)
        # Return minimal MVP shape
        resp = {
            'payment_id': data['id'],
            'order_id': data['order_id'],
            'stripe_payment_intent_id': data['stripe_payment_intent_id'],
            'status': data['status'],
            'amount_cents': data.get('amount_cents'),
            'total_amount': data.get('total_amount')
        }
        return jsonify(resp), 200
    except ValueError as e:
        return _error('not_found', str(e), 404)


# POST /payments/{payment_id}/refund
@payment_bp.route('/<int:payment_id>/refund', methods=['POST'])
@jwt_required()
def issue_refund(payment_id: int):
    body = request.get_json(silent=True) or {}
    amount = body.get("amount_cents")  # optional
    reason = body.get("reason")        # optional

    try:
        result = PaymentService.create_refund(
            payment_id, amount_cents=amount, reason=reason)
        return jsonify(result), 201
    except ValueError as e:
        return _error('not_found', str(e), 404)
    except stripe_errors.StripeError as err:
        current_app.logger.error(f"Refund failed: {err}")
        return _error('stripe_error', 'Stripe refund failed', 502, details=str(err), error_type=err.__class__.__name__)
    except Exception as e:
        current_app.logger.error(f"Refund error: {e}")
        return _error('internal_error', 'Unable to issue refund', 500, details=str(e), error_type=e.__class__.__name__)


# GET /payments/{payment_id}/refunds
@payment_bp.route('/<int:payment_id>/refunds', methods=['GET'])
@jwt_required()
def list_refunds(payment_id: int):
    try:
        items = PaymentService.list_refunds(payment_id)
        return jsonify({"refunds": items})
    except ValueError as e:
        return _error('not_found', str(e), 404)


# GET /payments/by-order/<order_id>
@payment_bp.route('/by-order/<int:order_id>', methods=['GET'])
@jwt_required()
def get_payment_by_order(order_id: int):
    order = db.session.get(Order, order_id)
    if not order or not order.payment:
        return _error('not_found', 'Payment for order not found', 404)
    p = order.payment
    return jsonify({
        'payment_id': p.id,
        'order_id': p.order_id,
        'status': p.status,
        'stripe_payment_intent_id': p.stripe_payment_intent_id,
        'total_amount': p.normalized_total,
        'amount_cents': p.amount_cents,
        'currency': p.currency,
        'payment_method': p.payment_method
    }), 200
