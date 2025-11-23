from extensions import db


class Payment(db.Model):
    """
    Payment Transaction Model

    Records payment transactions for orders with payment processor integration.
    One-to-one relationship with Order for transaction tracking.

    Attributes:
        id (int): Primary key, unique payment identifier
        order_id (int): Foreign key to Order, unique (one payment per order)
        status (str): Payment status (pending, completed, failed, refunded, etc.)
        total_amount (float): Amount charged/to be charged
        currency (str): Currency code (USD, EUR, etc.), defaults to USD
        payment_method (str): Method used (card, paypal, apple_pay, etc.)
        stripe_payment_intent_id (str): Stripe PaymentIntent ID for tracking
        paid_at (datetime): Timestamp when payment was successfully processed
        created_at (datetime): Payment record creation time
        updated_at (datetime): Last modification time (auto-updated)

    Integration Notes:
        - Designed for Stripe integration but adaptable to other processors
        - Status tracking enables payment state management
        - External IDs allow cross-reference with payment processor records
    """
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)

    # One-to-one relationship with Order
    order_id = db.Column(db.Integer, db.ForeignKey(
        'orders.id', ondelete='CASCADE'), nullable=False, unique=True)

    # Payment status tracking
    status = db.Column(db.String(32), nullable=False, default='pending')

    # Deprecated float storage (kept for backward compatibility). Prefer integer "amount_cents".
    total_amount = db.Column(db.Float, nullable=False)
    amount_cents = db.Column(db.Integer, nullable=False, default=0)
    # Integer cents stored natively; legacy float kept for backward compatibility.
    currency = db.Column(db.String(10), nullable=False, default='USD')
    payment_method = db.Column(db.String(50), nullable=False)
    stripe_payment_intent_id = db.Column(db.String(255), unique=True)
    paid_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=db.func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, default=db.func.now(),
                           onupdate=db.func.now(), nullable=False)

    # Relationships
    order = db.relationship('Order', back_populates='payment')

    @property
    def normalized_total(self) -> float:
        """Preferred dollar amount derived from amount_cents if present."""
        if self.amount_cents is not None:
            return self.amount_cents / 100.0
        return self.total_amount
