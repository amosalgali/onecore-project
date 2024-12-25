from flask import Flask, jsonify
from flask_cors import CORS
import requests
from pymongo import MongoClient
import json

# אתחול השרת
app = Flask(__name__)
CORS(app)

# חיבור למסד הנתונים
MONGO_URI = "mongodb+srv://algaliamos:zqdzXXOMbnIinOJJ@onecorecustomers.oiwzq.mongodb.net/"
client = MongoClient(MONGO_URI)
db = client.onecorecustomers
customers_collection = db.customers
versions_collection = db.Customer_version

# פונקציה להמיר את ה-ObjectId של MongoDB למחרוזת
def serialize_customer(customer):
    """פונקציה שממירה ObjectId למחרוזת בתוך האובייקט"""
    if '_id' in customer:
        customer['_id'] = str(customer['_id'])
    return customer

@app.route('/api/sync-versions', methods=['GET'])
def sync_versions():
    try:
        customers = db.customers.find()  # קבלת רשימת הלקוחות ממסד הנתונים
        updated_customers = []  # רשימה של לקוחות מעודכנים

        for customer in customers:
            if isinstance(customer, str):
                customer = json.loads(customer)

            try:
                print(f"עיבוד לקוח: {customer.get('name')}")
                response = requests.get(
                    f"{customer['URL']}/api/ProtectedApiDiagnostics/GetApiVersion",
                    json={
                        "UniquePOSIdentifier": {
                            "BranchNumber": customer['BranchNumber'],
                            "POSNumber": customer['POSNumber'],
                            "UniqueIdentifier": customer['UniqueIdentifier']
                        }
                    }
                )
                response.raise_for_status()  # אם יש שגיאה בבקשה, תזרוק חריגה
                if response.headers.get('Content-Type') == 'application/json':
                    version = response.json().get('version', "לא ידוע")
                else:
                    version = response.text.strip()

                # הסרת מרכאות כפולות אם קיימות
                version = version.strip('"')
                print(f"גרסה שנמצאה: {version}")
                # עדכון הגרסה במסד הנתונים
                db.customers.update_one(
                    {'_id': customer['_id']},
                    {'$set': {'version': version}},
                    upsert=True
                )
                updated_customers.append({**serialize_customer(customer), 'version': version})
            except Exception as e:
                print(f"שגיאה בלקוח {customer.get('name', 'לא ידוע')}: {e}")
                updated_customers.append({**serialize_customer(customer), 'version': "שגיאה"})

        return jsonify({"message": "סנכרון הסתיים בהצלחה", "updatedCustomers": updated_customers}), 200
    except Exception as e:
        print(f"שגיאה כללית: {e}")
        return jsonify({"message": "שגיאה בסנכרון", "error": str(e)}), 500

@app.route('/api/load-data', methods=['GET'])
def load_data():
    try:
        # קריאה למסד הנתונים או פעולת טעינת נתונים אחרת
        customers = list(db.customers.find())  # טוען את כל הלקוחות
        # המרה לאובייקטים סידוריים (JSON-serializable)
        serialized_customers = [serialize_customer(customer) for customer in customers]

        return jsonify({"message": "טעינת נתונים הושלמה", "customers": serialized_customers}), 200
    except Exception as e:
        print(f"שגיאה בטעינת נתונים: {e}")
        return jsonify({"message": "שגיאה בטעינת נתונים", "error": str(e)}), 500

if __name__ == '__main__':
    print("הפעלת השרת...")
    app.run(debug=True)  # הפעלת השרת במצב דיבוג
