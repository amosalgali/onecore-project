const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { MongoClient } = require('mongodb');

// הגדרות בסיסיות
const app = express();
const PORT = 3000;
const MONGO_URI = 'mongodb+srv://algaliamos:zqdzXXOMbnIinOJJ@onecorecustomers.oiwzq.mongodb.net/';
const DATABASE_NAME = 'onecorecustomers';

// שימוש ב-CORS
app.use(cors());

// חיבור ל-MongoDB
const client = new MongoClient(MONGO_URI);

app.get('/api/sync-versions', async (req, res) => {
    console.log('סנכרון גרסאות התחיל');
    try {
        await client.connect();
        console.log('חיבור ל-MongoDB הצליח');

        const db = client.db(DATABASE_NAME);
        const customersCollection = 'customers';
        const versionsCollection = 'Customer_version';

        // קריאה לנתונים מתוך MongoDB
        const customers = await db.collection(customersCollection).find().toArray();
        console.log(`נמצאו ${customers.length} לקוחות`);

        const updatedCustomers = [];
        print("נתונים שהתקבלו:", customers)

        for (const customer of customers) {
            try {
                const response = await axios.get(customer.URL + '/api/ProtectedApiDiagnostics/GetApiVersion', {
                    params: {
                        UniquePOSIdentifier: {
                            BranchNumber: customer.BranchNumber,
                            POSNumber: customer.POSNumber,
                            UniqueIdentifier: customer.UniqueIdentifier,
                        },
                    },
                });

                const version = response.data.version || 'לא ידוע';
                await db.collection(versionsCollection).updateOne(
                    { _id: customer._id },
                    { $set: { version } },
                    { upsert: true }
                );

                updatedCustomers.push({ ...customer, version });
            } catch (apiError) {
                console.error('שגיאה בקריאת API:', apiError.message);
                updatedCustomers.push({ ...customer, version: 'שגיאה' });
            }
        }

        console.log('סנכרון הסתיים');
        res.json({ message: 'סנכרון הסתיים בהצלחה', updatedCustomers });
    } catch (error) {
        console.error('שגיאה בסנכרון גרסאות:', error.message);
        res.status(500).json({ error: 'שגיאה בסנכרון גרסאות' });
    } finally {
        await client.close();
        console.log('חיבור ל-MongoDB נסגר');
    }
});

// הפעלת השרת
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
