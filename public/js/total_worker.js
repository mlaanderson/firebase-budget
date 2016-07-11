//var window = this;
//var document = this;
//
//window.screen = {availHeight: 0, availWidth: 0};

//importScripts('https://www.gstatic.com/firebasejs/3.1.0/firebase.js');
importScripts('/js/math.ext.js');
importScripts('/js/date.ext.js');

//var config = {
//    apiKey: "AIzaSyDhs0mPVlovk6JHnEdv6HeU2jy3M8VRoSk",
//    authDomain: "budget-dacac.firebaseapp.com",
//    databaseURL: "https://budget-dacac.firebaseio.com",
//    storageBucket: "budget-dacac.appspot.com",
//};
//firebase.initializeApp(config);

var CATEGORIES = [
    "Income",
    "Charity",
    "Saving",
    "Housing",
    "Utilities",
    "Food",
    "Clothing",
    "Transportation",
    "Medical",
    "Insurance",
    "Personal",
    "Recreation",
    "Debt"
];

function sortTransactionsByDate(obj) {
    var result = [];
    for (var k in obj) {
        var o = obj[k];
        o.__key__ = k;
        result.push(o);
    }
    
    function sorter(o1, o2) {
        if (o1.date != o2.date  ) {
            return Date.parse(o1.date) - Date.parse(o2.date);
        }
        if (o1.category != o2.category) {
            return CATEGORIES.indexOf(o1.category) - CATEGORIES.indexOf(o2.category);
        }
        
        var tarray = [o1.name, o2.name];
        tarray.sort();
        if (o1.name == tarray[0]) {
            return -1;
        } else {
            return 1;
        }
    }
    
    result.sort(sorter);
    
    return result;
}

function sendUpdate(key, total) {
    setTimeout(function() {
        self.postMessage({ key: key, total: total});
    }, Math.round(Math.random() * 500));
}

self.addEventListener('message', function(e) {
    var checks = e.data[0];
    var transactions = e.data[1];
    var today = e.data[2];
    
    var sum = 0;
    var items = sortTransactionsByDate(transactions);
    
    if (checks) {
        for (var k in checks) {
            // only subtract the checks that aren't linked here
            if ((checks[k].link === undefined) || (transactions[checks[k].link] === undefined)) {
                sum -= checks[k].amount;
            }
        }
    }

    for (var n = 0; n < items.length; n++) {
        sum = Math.roundTo(items[n].amount + sum, 2);
        if (items[n].total != sum) {
            if ((today.subtract('2 weeks').lt(items[n].date) == true) &&
                (today.add('2 weeks').gt(items[n].date))) {
              self.postMessage({ key: items[n].__key__, total: sum });
            } else {
                sendUpdate(items[n].__key__, sum);
            }
        }
    }
    
}, false);