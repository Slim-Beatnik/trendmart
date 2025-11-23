import stripe
from flask import current_app
from datetime import datetime
from extensions import db
from models.payment import Payment
from models.shopping import Order


class PaymentService:
    """
    Handles all the Stripe payment for our e-commerce app.

    This class basically wraps all the Stripe API calls and manages our
    payment records in the database. I tried to keep it simple but still
    handle all the edge cases we might run into.
    """

    @staticmethod
    def create_payment_intent(order_id, amount, currency='usd', metadata=None):
        """
        Creates a Stripe PaymentIntent for an order.

        This is the first step in our payment flow - we create the intent on our
        backend, then send the client_secret to the frontend so they can confirm
        the payment with Stripe.js.

        Args:
            order_id: The ID of the order we're creating payment for
            amount: Payment amount in cents (so $19.99 = 1999)
            currency: Three-letter currency code, defaults to USD
            metadata: Any extra data we want to store with the payment

        Returns:
            Dictionary with client_secret (for frontend), payment_intent_id,
            and our internal payment_id

        Note: This creates a pending Payment record in our DB right away, even
        before the customer actually pays. The webhook will update the status later.
        """
        try:
            # Check if order exists first
            order = db.session.get(Order, order_id)
            if not order:
                raise ValueError(f"Order {order_id} not found")

            # Idempotent reuse: if there's an existing non-final payment with an intent, reuse it
            existing = order.payment
            if existing and existing.stripe_payment_intent_id and not PaymentService._is_final_status(existing.status):
                try:
                    intent = stripe.PaymentIntent.retrieve(
                        existing.stripe_payment_intent_id)
                    return {
                        'client_secret': intent.client_secret,
                        'payment_intent_id': intent.id,
                        'payment_id': existing.id,
                        'order_id': order_id,
                        'status': existing.status,
                    }
                except Exception as e:
                    current_app.logger.warning(
                        f"[payments.service] Reuse failed; creating new intent: {e}")

            # Create Intent on Stripe
            # Use idempotency key so repeated client calls (network retries) don't create duplicates.
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=currency,
                automatic_payment_methods={'enabled': True},
                metadata={
                    'order_id': str(order_id),
                    'integration': 'trendmart',
                    **({'user_id': str(order.user_id)} if getattr(order, 'user_id', None) is not None else {}),
                    **(metadata or {})
                },
                idempotency_key=f"order_{order_id}"
            )

            # Persist pending payment (create new or update existing if present but final)
            if existing and PaymentService._is_final_status(existing.status):
                payment = existing
            elif existing is None:
                payment = Payment(
                    order_id=order_id,
                    total_amount=amount / 100.0,  # legacy field
                    amount_cents=amount,
                    currency=currency.upper(),
                    payment_method='card',
                    stripe_payment_intent_id=intent.id,
                    status='pending'
                )
                db.session.add(payment)
            else:
                payment = existing
            # Normalize / refresh fields each time we (re)create intent
            payment.total_amount = amount / 100.0
            payment.amount_cents = amount
            payment.currency = currency.upper()
            payment.payment_method = 'card'
            payment.stripe_payment_intent_id = intent.id
            payment.status = 'pending'

            db.session.commit()

            return {
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id,
                'payment_id': payment.id,
                'order_id': order_id,
                'status': payment.status,
            }

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Payment creation failed: {e}")
            raise

    @staticmethod
    def confirm_payment(payment_intent_id):
        """
        Updates our payment record when Stripe confirms (or fails) a payment.

        This gets called either manually or from our webhook handler. It checks
        the current status of a PaymentIntent in Stripe and updates our database
        to match. Pretty straightforward but important for keeping everything in sync.

        Args:
            payment_intent_id: The Stripe PaymentIntent ID we want to check

        Returns:
            The updated Payment object from our database

        Note: If the payment succeeded, we also try to grab the actual payment
        method that was used (card, apple_pay, etc.) and store that too.
        """
        try:
            # Get the payment intent from Stripe
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            # Find our payment record
            payment = Payment.query.filter_by(
                stripe_payment_intent_id=payment_intent_id
            ).first()

            if not payment:
                raise ValueError(
                    f"Can't find payment for intent {payment_intent_id}")

            # Update status based on what happened
            status = intent.status
            if status == 'succeeded':
                payment.status = 'completed'
                payment.paid_at = datetime.utcnow()
                if intent.charges.data:
                    ch = intent.charges.data[0]
                    if ch.payment_method_details:
                        payment.payment_method = ch.payment_method_details.type
                # Sync order status on success
                if payment.order:
                    payment.order.status = 'paid'
            elif status in ('payment_failed', 'canceled'):
                payment.status = 'failed' if status == 'payment_failed' else 'canceled'
            else:
                # Just use whatever Stripe says
                payment.status = status

            db.session.commit()
            return payment

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Failed to confirm payment: {e}")
            raise

    @staticmethod
    def process_webhook_event(event):
        """
        Processes incoming webhook events from Stripe.

        Stripe sends us webhooks whenever something happens with a payment -
        succeeded, failed, canceled, etc. This method looks at the event type
        and calls the right handler to update our payment records.

        Args:
            event: The webhook event data from Stripe (already parsed JSON)

        Returns:
            True if we handled the event successfully, False if something went wrong

        Note: We only handle the payment_intent events we care about. Other
        event types just get logged and ignored for now. Might expand this later
        if we need to handle refunds, disputes, etc.
        """
        try:
            t = event['type']
            if t in ('payment_intent.succeeded', 'payment_intent.payment_failed', 'payment_intent.canceled'):
                payment_intent = event['data']['object']
                PaymentService.confirm_payment(payment_intent['id'])
            else:
                current_app.logger.info(f"Unhandled Stripe event: {t}")
            return True
        except Exception as e:
            current_app.logger.error(f"Webhook processing failed: {e}")
            return False

    @staticmethod
    def get_payment_status(payment_id):
        """Return normalized payment status/details for API consumers."""
        p = db.session.get(Payment, payment_id)
        if not p:
            raise ValueError(f"Payment {payment_id} not found")
        return {
            'id': p.id,
            'order_id': p.order_id,
            'stripe_payment_intent_id': p.stripe_payment_intent_id,
            'status': p.status,
            'total_amount': p.normalized_total,
            'amount_cents': p.amount_cents,
            'currency': p.currency,
            'payment_method': p.payment_method,
            'created_at': p.created_at.isoformat(),
            'paid_at': p.paid_at.isoformat() if p.paid_at else None,
        }

    @staticmethod
    def _is_final_status(status: str) -> bool:
        """Return True if the local payment status is considered final."""
        if not status:
            return False
        return status.lower() in {"completed", "failed", "canceled", "refunded"}

    @staticmethod
    def create_refund(payment_id: int, amount_cents: int | None = None, reason: str | None = None):
        """
        Issue a refund against the Stripe PaymentIntent for this payment.
        If amount_cents is None, a full refund is attempted.
        """
        p = db.session.get(Payment, payment_id)
        if not p or not p.stripe_payment_intent_id:
            raise ValueError(
                f"Payment {payment_id} not found or missing PaymentIntent")

        params = {"payment_intent": p.stripe_payment_intent_id}
        if amount_cents is not None:
            params["amount"] = amount_cents
        if reason:
            # e.g. 'requested_by_customer' or 'fraudulent'
            params["reason"] = reason

        r = stripe.Refund.create(**params)
        return {
            "id": r.id,
            "status": r.status,
            "amount": r.amount,
            "currency": r.currency,
            "created": r.created,
            "payment_intent_id": r.payment_intent,
        }

    @staticmethod
    def list_refunds(payment_id: int):
        """
        List refunds for the payment's PaymentIntent.
        """
        p = db.session.get(Payment, payment_id)
        if not p or not p.stripe_payment_intent_id:
            raise ValueError(
                f"Payment {payment_id} not found or missing PaymentIntent")

        refunds = stripe.Refund.list(payment_intent=p.stripe_payment_intent_id)
        items = []
        for r in refunds.auto_paging_iter():
            items.append({
                "id": r.id,
                "status": r.status,
                "amount": r.amount,
                "currency": r.currency,
                "created": r.created,
            })
        return items
