from flask import Blueprint, request, jsonify, current_app
from werkzeug.exceptions import BadRequest
import stripe
from marshmallow import ValidationError

from schemas.payment import PaymentIntentCreateSchema
from extensions import db
from flask_jwt_extended import jwt_required
from utils.payment_service import PaymentService
from models.shopping import Order

# PLURAL prefix to match your desired routes
payment_bp = Blueprint('payments', __name__, url_prefix='/payments')


def _error(code: str, message: str, status: int):
    return jsonify({"error": code, "message": message}), status


@payment_bp.route('/config', methods=['GET'])
@jwt_required(optional=True)
def get_stripe_config():
    publishable_key = current_app.config.get('STRIPE_PUBLISHABLE_KEY')
    if not publishable_key:
        return _error('config_error', 'Stripe publishable key not configured', 500)
    return jsonify({'publishableKey': publishable_key}), 200


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
            metadata={'source': 'api'}
        )
        # result already includes: payment_id, order_id, client_secret, status
        return jsonify(result), 200
    except Exception as e:
        return _error('stripe_error', str(e), 502)


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
    except Exception as e:
        return _error('stripe_error', str(e), 400)


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
