
from flask import Flask, jsonify
from flask_cors import CORS
from db import get_connection

app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "success",
        "message": "Popoye Insurance API is running"
    })


@app.route("/api/db-test", methods=["GET"])
def db_test():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT DATABASE()")
        database_name = cursor.fetchone()[0]

        return jsonify({
            "status": "success",
            "database": database_name
        })

    except Exception:
        app.logger.exception("Database test failed")
        return jsonify({
            "status": "error",
            "message": "Database connection failed"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.route("/api/customers", methods=["GET"])
def get_customers():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                customer_code,
                full_name,
                phone,
                email,
                vehicle_number
            FROM customers
            ORDER BY id DESC
        """)

        customers = cursor.fetchall()

        return jsonify({
            "status": "success",
            "count": len(customers),
            "customers": customers
        })

    except Exception:
        app.logger.exception("Customers query failed")
        return jsonify({
            "status": "error",
            "message": "Could not retrieve customers"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.route("/api/policies", methods=["GET"])
def get_policies():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                p.policy_number,
                p.policy_type,
                c.full_name,
                c.vehicle_number,
                p.premium,
                p.start_date,
                p.expiry_date,
                p.status
            FROM policies p
            JOIN customers c
                ON p.customer_id = c.id
            ORDER BY p.id DESC
        """)

        policies = cursor.fetchall()

        for policy in policies:
            policy["premium"] = float(policy["premium"])

            if policy["start_date"]:
                policy["start_date"] = str(policy["start_date"])

            if policy["expiry_date"]:
                policy["expiry_date"] = str(policy["expiry_date"])

        return jsonify({
            "status": "success",
            "count": len(policies),
            "policies": policies
        })

    except Exception:
        app.logger.exception("Policies query failed")
        return jsonify({
            "status": "error",
            "message": "Could not retrieve policies"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


if __name__ == "__main__":
    app.run(debug=True)
