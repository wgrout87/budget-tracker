let db;

// Requests opening a conncetion to a database, with parameters name and version
const request = indexedDB.open('budget_tracker', 1)

// This event will fire when an attempt is made to open a database with a version number higher than its current version (works like an event listener)
request.onupgradeneeded = function (event) {
    // Save a reference to the database (the result attribute from indexedDB.open())
    db = event.target.result;
    // Create an object store called 'new_transaction', with an auto-incrementing option
    db.createObjectStore('new_transactions', { autoIncrement: true });
};

// This event will fire when a connection to a database is successfully opened by indexedDB.open() (works like an event listener)
request.onsuccess = function (event) {
    // Save a reference to the database (the result attribute from indexedDB.open())
    db = event.target.result;

    // Uploads any saved transactions if the browser has internet connection
    if (navigator.onLine) {
        uploadTransaction();
    }
};

// This event will fire when a connection to a database is unsuccessfully opened by indexedDB.open() (works like an event listener)
request.onerror = function (event) {
    // Logs the error
    console.log(event.target.errorCode);
};

// Saves a record of any transactions made - for when there is no internet connection - called by index.js when a fetch request fails
function saveRecord(record) {
    const transaction = db.transaction(['new_transactions'], 'readwrite');

    const transactionObjectStore = transaction.objectStore('new_transactions');

    transactionObjectStore.add(record);

    alert('You\'re currently offline. Transaction has been saved for submission when internet connection is restored.')
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

                    alert('You\'re back online. All saved transaction has been submitted.');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
};

window.addEventListener('online', uploadTransaction);