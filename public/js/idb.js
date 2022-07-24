let db;

const request = indexedDB.open('budget_tracker', 1)

request.onupgradeneeded = function (event) {
    db = event.target.result;

    db.createObjectStore('new_transactions', { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['new_transactions'], 'readwrite');

    const transactionObjectStore = transaction.objectStore('new_transactions');

    transactionObjectStore.add(record);
};

function uploadTransaction() {
    // Open a transaction on your db
    const transaction = db.transaction(['new_transactions'], 'readwrite');

    // Access your object store
    const transactionObjectStore = transaction.objectStore('new_transactions');

    // Get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();

    // Upon a successful .getAll() execution, run this function
    getAll.onsuccess = function () {
        // If there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }

                    // Open one more transaction
                    const transaction = db.transaction(['new_transactions'], 'readwrite');

                    // Access the new_transactions object store
                    const transactionObjectStore = transaction.objectStore('new_transactions');

                    // Clear all items in your store
                    transactionObjectStore.clear();

                    alert('All saved transaction has been submitted')
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
};

window.addEventListener('online', uploadTransaction);