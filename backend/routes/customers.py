from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from schemas.registration import UserSchema, UserRegistrationSchema, CustomerProfileSchema, AddressSchema
from extensions import db
from models.registration import User, CustomerProfile, Address
from werkzeug.security import generate_password_hash
from sqlalchemy import select, delete
from marshmallow import ValidationError

# Create the customers blueprint
customers_bp = Blueprint('customers', __name__, url_prefix='/customers')


@customers_bp.route('/', methods=['GET'])
@jwt_required()
def get_user():
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(UserSchema().dump(user)), 200


@customers_bp.route('/profile', methods=['POST', 'PATCH'])
@jwt_required()
def update_customer_profile():
    try:
        current_user_id = int(get_jwt_identity())
        user = db.session.get(User, current_user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        profile_data = request.json

        # Check if profile already exists
        existing_profile = db.session.execute(
            select(CustomerProfile).filter_by(user_id=current_user_id)
        ).scalar_one_or_none()

        if existing_profile:
            # Update existing profile
            if 'first_name' in profile_data:
                existing_profile.first_name = profile_data['first_name']
            if 'last_name' in profile_data:
                existing_profile.last_name = profile_data['last_name']
            if 'phone' in profile_data:
                existing_profile.phone = profile_data['phone']

            db.session.commit()
            return jsonify({
                "message": "Profile updated successfully",
                "profile": CustomerProfileSchema().dump(existing_profile)
            }), 200
        else:
            # Create new profile
            new_profile = CustomerProfile(
                user_id=current_user_id,
                first_name=profile_data.get('first_name'),
                last_name=profile_data.get('last_name'),
                phone=profile_data.get('phone')
            )

            db.session.add(new_profile)
            db.session.commit()

            return jsonify({
                "message": "Profile created successfully",
                "profile": CustomerProfileSchema().dump(new_profile)
            }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update profile"}), 500


@customers_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_customer_profile():
    try:
        current_user_id = int(get_jwt_identity())
        user = db.session.get(User, current_user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        profile = db.session.execute(
            select(CustomerProfile).filter_by(user_id=current_user_id)
        ).scalar_one_or_none()

        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        return jsonify(CustomerProfileSchema().dump(profile)), 200

    except Exception as e:
        return jsonify({"error": "Failed to retrieve profile"}), 500


@customers_bp.route('/addresses', methods=['GET'])
@jwt_required()
def get_customer_addresses():
    try:
        current_user_id = int(get_jwt_identity())
        addresses = db.session.execute(
            select(Address).filter_by(user_id=current_user_id)
        ).scalars().all()
        return jsonify(AddressSchema(many=True).dump(addresses)), 200

    except Exception as e:
        return jsonify({"error": "Failed to retrieve addresses"}), 500


@customers_bp.route('/addresses', methods=['POST'])
@jwt_required()
def add_customer_address():
    try:
        current_user_id = int(get_jwt_identity())
        print("current_user_id:", current_user_id)
        address_data = request.json

        new_address = Address(
            user_id=current_user_id,
            line1=address_data.get('line1'),
            line2=address_data.get('line2'),
            city=address_data.get('city'),
            state=address_data.get('state'),
            zip_code=address_data.get('zip_code'),
            country=address_data.get('country')
        )

        db.session.add(new_address)
        db.session.commit()

        return jsonify({
            "message": "Address added successfully",
            "address": AddressSchema().dump(new_address)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to add address"}), 500


@customers_bp.route('/addresses/<int:address_id>', methods=['DELETE'])
@jwt_required()
def delete_customer_address(address_id):
    try:
        current_user_id = int(get_jwt_identity())

        address = db.session.execute(
            select(Address).filter_by(id=address_id, user_id=current_user_id)
        ).scalar_one_or_none()

        if not address:
            return jsonify({"error": "Address not found"}), 404

        db.session.delete(address)
        db.session.commit()

        return jsonify({"message": "Address deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete address"}), 500

# Set as default address


@customers_bp.route('/set_default_address/<int:address_id>', methods=['PATCH'])
@jwt_required()
def set_default_address(address_id):
    try:
        current_user_id = int(get_jwt_identity())
        profile = db.session.execute(
            select(CustomerProfile).filter_by(user_id=current_user_id)
        ).scalar_one_or_none()
        # Auto-create profile if it doesn't exist yet so default address can be set
        if not profile:
            # CustomerProfile requires first_name and last_name (non-nullable) so provide safe placeholders
            user = db.session.get(User, current_user_id)
            base_name = (user.email.split(
                '@')[0] if user and user.email else 'user')
            profile = CustomerProfile(
                user_id=current_user_id,
                first_name=base_name,
                last_name='profile',
                phone=None
            )
            db.session.add(profile)
            db.session.flush()  # get id

        address = db.session.execute(
            select(Address).filter_by(id=address_id, user_id=current_user_id)
        ).scalar_one_or_none()

        if not address:
            return jsonify({"error": "Address not found"}), 404

        # Set the new default address
        profile.default_address_id = address.id
        db.session.commit()

        return jsonify({
            "message": "Address set as default successfully",
            "default_address": AddressSchema().dump(address)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to set default address", "detail": str(e)}), 500


@customers_bp.route('/default_address', methods=['GET'])
@jwt_required()
def get_default_address():
    try:
        current_user_id = int(get_jwt_identity())
        profile = db.session.execute(
            select(CustomerProfile).filter_by(user_id=current_user_id)
        ).scalar_one_or_none()
        if not profile or not profile.default_address_id:
            return jsonify({"default_address": None}), 200
        address = db.session.execute(
            select(Address).filter_by(
                id=profile.default_address_id, user_id=current_user_id)
        ).scalar_one_or_none()
        if not address:
            return jsonify({"default_address": None}), 200
        return jsonify({"default_address": AddressSchema().dump(address)}), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch default address"}), 500
