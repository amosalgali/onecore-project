// טען נתונים מהשרת והצג בטבלה
async function loadData() {
    const statusElement = document.getElementById("status");
    const loadDataBtn = document.getElementById("loadDataBtn");

    try {
        loadDataBtn.disabled = true;
        loadDataBtn.textContent = "טוען נתונים...";

        const response = await fetch('http://127.0.0.1:5000/api/load-data');
        const data = await response.json();

        console.log("תשובת השרת:", data);  // הדפסה של תשובת השרת

        if (response.ok) {
            if (Array.isArray(data.customers)) {
                statusElement.textContent = "נתונים נטענו בהצלחה.";
                const tableBody = document.getElementById("customerTable");
                tableBody.innerHTML = "";

                data.customers.forEach(customer => {
                    const version = customer.version || "לא ידוע";  // אם אין גרסה, הצג "לא ידוע"
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${customer.name}</td>
                        <td>${customer.license}</td>
                        <td>${customer.comments}</td>
                        <td>${customer.version || "לא ידוע"}</td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                statusElement.textContent = "נתונים לא תקינים: customers אינם מערך";
                console.error("נתונים לא תקינים:", data);
            }
        } else {
            statusElement.textContent = "שגיאה בטעינת הנתונים.";
            console.error("שגיאה בטעינת נתונים:", data.message);
        }
    } catch (error) {
        statusElement.textContent = "שגיאה בתקשורת עם השרת.";
        console.error("שגיאה בטעינת נתונים:", error);
    } finally {
        loadDataBtn.disabled = false;
        loadDataBtn.textContent = "טען נתונים";
    }
}


// סנכרון גרסאות
async function syncVersions() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/sync-versions');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('סנכרון הסתיים בהצלחה:', data);

        const statusElement = document.getElementById('status');
        statusElement.textContent = 'סנכרון הסתיים בהצלחה';
    } catch (error) {
        console.error('שגיאה בסנכרון גרסאות:', error);
        const statusElement = document.getElementById('status');
        statusElement.textContent = 'שגיאה בסנכרון גרסאות';
    }
}

// התחבר לכפתורים
document.getElementById("loadDataBtn").addEventListener("click", loadData);
document.getElementById("syncVersionsBtn").addEventListener("click", syncVersions);
