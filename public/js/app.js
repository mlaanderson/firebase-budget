var m_primaryAccount = null;
var m_totalLock = false;
var m_today;
var m_totalWorker = new Worker('js/total_worker.js');
var m_periodStart, m_periodEnd;
var totals = [], transactions = [], chart, rendering = false;

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


function sortObjectByKey(me, key, sorter) {
    // returns an array with the sub objects
    // adds __key__ to each item
    var result = [];
    sorter = sorter || function (o1, o2) {
        var tlist = [o1[key], o2[key]];
        tlist.sort();
        
        if (o1[key] == tlist[0]) {
            return -1;
        }
        return 1;
    };
    
    for (var k in me) {
        if (Function.prototype.isPrototypeOf(me[k]) == false) {
            result.push(me[k]);
            result[result.length - 1].__key__ = k;
        }
    }
    
    result.sort(sorter);
    
    return result;
}

function sortTransactions(obj) {
    var result = [];
    for (var k in obj) {
        var o = obj[k];
        o.__key__ = k;
        result.push(o);
    }
    
    function sorter(o1, o2) {
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

function sortTransactionsByDate(obj) {
    var result = [];
    for (var k in obj) {
        var o = obj[k];
        o.__key__ = k;
        result.push(o);
    }
    
    function sorter(o1, o2) {
        if (o1.date != o2.date) {
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

function Initialize() {
    $.mobile.loading();
    
    firebase.auth().onAuthStateChanged(app_AuthStateChanged);
    
    m_today = Date.today();
    
    $('#btnLogout').on('click', btnLogout_Click);
    $('#btnPrev').on('click', btnPrev_Click);
    $('#btnNext').on('click', btnNext_Click);
    $('#btnCheck').on('click', btnCheck_Click);
    $('#periodMenu').on('change', periodMenu_Change);
    $('#btnCash').on('click', btnCash_Click);
    $('#btnAddTransaction').on('click', addTransaction);
    $('#btnEditTransaction').on('click', editSelectedTransaction);
    $('#main').on('mouseout', function() {
        setTimeout(function() {
            $('#btnEditTransaction').prop('targetId', '');
        }, 150);
    });
    m_totalWorker.onmessage = totalWorker_Message;
}

function totalWorker_Message(e) {
    var data = e.data;
    if (typeof data == "object") {
        m_primaryAccount.child('transactions').child(data.key).update({total: data.total});
    } else {
        console.log(data.toString());
    }
}

function render(file, data, callback) {
    if ((callback === undefined) && (Function.prototype.isPrototypeOf(data) === true)) {
        callback = data;
        data = {};
    }
    
    callback = callback || function(){};
    data = data || {};
    
    ejs.renderFile(file, data, function(template) {
        $('#main').empty().append(template);
        callback(file, data, template);
    });
}

function root() {
    if (firebase.auth().currentUser == null) {
        throw "Not signed in";
    }
    
    return firebase.database().ref().child(firebase.auth().currentUser.uid);
}

function updateRunningTotal() {
    if (m_totalLock == true) return;
    m_totalLock = true;
    
    $.mobile.loading('show');
    
    m_primaryAccount.child('checks').once('value').then(function(csnap) {
        m_primaryAccount.child('transactions').once('value').then(function(snap) {
            $.mobile.loading('hide');
            m_totalLock = false;
            m_totalWorker.postMessage([csnap.val(), snap.val(), m_today]);
        });
    });
}

function updateScreen(snapshot) {
    handleUpdate(snapshot);
}

function selectPeriod() {
    $.mobile.loading('show');
    $('*').blur();
    m_primaryAccount
        .child('periods')
        .orderByChild('start')
        .endAt(m_today.toFbString())
        .limitToLast(1)
        .once('child_added')
        .then(function(snap) {
            var start = snap.val().start;
            var end = snap.val().end;
            
            m_periodStart = start;
            m_periodEnd = end;
            
            
            document.title = Date.parseFb(start).format('MMM d') + " - " +
                Date.parseFb(end).format('MMM d');
            
            $('#tblTransactions tbody').empty();
            m_primaryAccount
                .child('transactions')
                .orderByChild('date')
                .startAt(start)
                .endAt(end)
                .once('value')
                .then(function(tsnap) {
                    var items = sortTransactions(tsnap.val());
                    ejs.renderFile('transaction', { items: items }, function(template) {
                        $('#tblTransactions tbody').append($(template));
                        $.mobile.loading('hide');
                        $('#periodMenu').val(start);
                        $('#periodMenu').selectmenu('refresh');
                        $('#main').css('max-height', ($(window).height() - $('[data-role=header]').height() - $('[data-role=footer]').height() - 42) + 'px');
                    });
                });
                
                if ($('#footer_info').css('display') != 'none') {
                    m_primaryAccount
                        .child('transactions')
                        .orderByChild('date')
                        //.startAt(m_today.toFbString())
                        .on('value', populateChart);
                }
        });
}

function saveTransaction(e) {
    $.mobile.loading('show');

    var isDeposit = $('#type').prop('checked');
    var checkNumber = $('#checkNumber').val();
    var checkLink = $('#checkLink').val();
    
    if ((checkNumber != "") && (checkLink == "")) {
        // create the new check
        var ref = m_primaryAccount.child('checks').push();
        checkLink = ref.key;
        if (e.data.id) {
            ref.set({
                number: checkNumber,
                description: $('#name').val(),
                amount: $('#amount').val() * 1,
                link: e.data.id
            });
        } else {
            ref.set({
                number: checkNumber,
                description: $('#name').val(),
                amount: $('#amount').val() * 1
            });
        }
    }
    
    
    var data = {
        'date': $('#date').val(),
        'category': $('#category').val(),
        'name': $('#name').val(),
        'amount': $('#amount').val() * (isDeposit ? 1 : -1),
        'cash': $('#cash').prop('checked') && (isDeposit == false),
        'total': 0,
        'paid': $('#paid').prop('checked')
    }
    
    if (checkNumber != "") {
        data.check = checkNumber;
    
        if (checkLink != "") {
            data.checkLink = checkLink;
        }
    } else {
        data.check = null;
        data.checkLink = null;
    }
    
    if (e.data.id) {
        m_primaryAccount.child('transactions').child(e.data.id).once('value', function(snap) {
            var oldAmount = snap.val().amount;
            var oldCheckLink = snap.val().checkLink;
            
            
            if ((checkLink == "") && (oldCheckLink !== undefined)) {
                // remove the links
                m_primaryAccount.child('checks').child(oldCheckLink).child('link').remove();
            }

            data.total = snap.val().total;
            m_primaryAccount.child('transactions').child(e.data.id).update(data).then(function() {
                $('#transactionEditor').empty();
                $('#transactionEditor').popup('close');
                $('#transactionEditor').remove();
                
                if ((data.amount != oldAmount) || (checkLink != oldCheckLink)) {
                    updateRunningTotal();
                } else {
                    $.mobile.loading('hide');
                }
            });
        });
    } else {
        var ref = m_primaryAccount.child('transactions').push();
        if (checkLink != "") {
            m_primaryAccount.child('checks').child(checkLink).update({ link: ref.key });
        }
        ref.set(data).then(function() {
            $('#transactionEditor').empty();
            $('#transactionEditor').popup('close');
            $('#transactionEditor').remove();
            selectPeriod();
            updateRunningTotal();
        });
    }
    
}

function deleteTransaction(e) {
    if (e.data.id) {
        $.mobile.loading('show');
        m_primaryAccount.child('transactions').child(e.data.id).remove()
        .then(function() {
            $('#transactionEditor').empty();
            $('#transactionEditor').popup('close');
            $('#transactionEditor').remove();
            selectPeriod();
            $.mobile.loading('hide');
        })
        .catch(function(err) {
            console.log(err);
        });
    }
}

function editSelectedTransaction(e) {
    console.log('editSelectedTransaction');
    var id = $('#btnEditTransaction').prop('targetId');
    e.preventDefault();
    $('*').blur();
    if (id) {
        editTransaction(id);
    }
}

function editTransaction(transId) {
    m_primaryAccount.child('transactions').child(transId).once('value', function(snap) {
        var trans = snap.val();
        trans.id = transId;
        ejs.renderFile('edittransaction', trans, function(template) {
            var dialog = $(template)
            .popup({
                history: false,
                overlayTheme: 'b',
                afteropen: function() {
                    $('#btnSave').on('click', { id: transId }, saveTransaction);
                    $('#btnDelete').on('click', {id: transId }, deleteTransaction);
                }
            }).popup('open');
        });
    });
}

function addTransaction() {
    var trans = {
        date: m_today.toFbString(),
        category: CATEGORIES[0],
        name: '',
        amount: 0,
        cash: false,
        id: null
    }
    
    ejs.renderFile('edittransaction', trans, function(template) {
        var dialog = $(template);
        dialog.popup({
            history: false,
            overlayTheme: 'b',
            afteropen: function() {
                $('#btnSave').on('click', { id: null }, saveTransaction);
            }
        }).popup('open');
    });
}

function previewTransaction(id) {
    $('#btnEditTransaction').prop('targetId', id);
    m_primaryAccount.child('transactions').child(id).once('value', function(tsnap) {
        var item = tsnap.val();
        m_primaryAccount.child('transactions').orderByChild('name')
            .startAt(item.name).endAt(item.name)
            .once('value', function(snap) {
                var items = sortTransactionsByDate(snap.val());
                // remove the items that don't match the category
                for (var n = 0; n < items.length;) {
                    if (items[n].category != item.category) {
                        items.splice(n, 1);
                    } else {
                        n++;
                    }
                }
                
                // then display them in the info_div
                ejs.renderFile('info', { title: item.name, items: items }, function(template) {
                    $('#info_div').empty().append($(template));
                });
            });
    });
}

function saveRecurring(e) {
    var id = e.data.id;
    var isDeposit = $('#type').prop('checked');
    var data = {
        'start': $('#start').val(),
        'end': $('#end').val(),
        'category': $('#category').val(),
        'name': $('#name').val(),
        'amount': $('#amount').val() * (isDeposit ? 1 : -1),
        'cash': $('#cash').prop('checked') && (isDeposit == false),
        'period': $('#period').val()
    };
    
    $.mobile.loading('show');
    
    console.log(data);
    
    if (id) {
        // update
        m_primaryAccount.child('recurring').child(id).update(data).then(function() {
            // delete existing from today forward
            // then re-add according to the schedule
            m_primaryAccount.child('transactions').orderByChild('recurring')
                .startAt(id)
                .endAt(id)
                .once('value', 
            function(snap) {
                var trans = snap.val();
                var minDate = Date.max(Date.parseFb(data.start), new Date());
                for (var k in trans) {
                    if (Date.parseFb(trans[k].date).ge(minDate) == true) {
                        m_primaryAccount.child('transactions').child(k).remove()
                    }
                }
                
                for (var d = Date.parseFb(data.start); d.le(data.end); d = d.add(data.period)) {
                    if (d.ge(minDate) == true) {
                        m_primaryAccount.child('transactions').push({
                            amount: data.amount,
                            cash: data.cash,
                            category: data.category,
                            date: d.toFbString(),
                            name: data.name,
                            paid: false,
                            recurring: id
                        });
                    }
                }

                $.mobile.loading('hide');
                $('#recurringEditor').popup('close');
                $('#recurringEditor').empty();
                $('#recurringEditor').remove();
                
                updateRunningTotal();
            });
        });
    } else {
        // insert
        m_primaryAccount.child('recurring').child(id).push(data).then(function() {
            $.mobile.loading('hide');
            $('#recurringEditor').popup('close');
            $('#recurringEditor').empty();
            $('#recurringEditor').remove();
        });
    }
}


function editRecurring(transId) {
    m_primaryAccount.child('recurring').child(transId).once('value', function(snap) {
        var trans = snap.val();
        trans.id = transId;
        ejs.renderFile('editrecurring', trans, function(template) {
            var dialog = $(template)
            .popup({
                history: false,
                overlayTheme: 'b',
                afteropen: function() {
                    $('#btnSave').on('click', { id: transId }, saveRecurring);
                }
            }).popup('open');
        });
    });
}

function clearCheck(e) {
    if (e.data.id) {
        $.mobile.loading('show');
        m_primaryAccount.child('checks').child(e.data.id).remove().then(function() {
            $.mobile.loading('hide');
        });
    }
}

function btnCash_Click() {
    $.mobile.loading('show');
    $('*').blur();
    m_primaryAccount
        .child('periods')
        .orderByChild('start')
        .endAt(m_today.toFbString())
        .limitToLast(1)
        .once('child_added')
        .then(function(snap) {
            var start = snap.val().start;
            var end = snap.val().end;
            
            m_primaryAccount
                .child('transactions')
                .orderByChild('date')
                .startAt(start)
                .endAt(end)
                .once('value')
                .then(function(tsnap) {
                    var items = sortTransactions(tsnap.val());
                    var cash = (0).toCash();
                    var total = 0;
                    
                    for (var n = 0; n < items.length; n++) {
                        if ((items[n].cash == true) && (items[n].amount < 0)) {
                            var itemCash = (-1 * items[n].amount).toCash();
                            total -= items[n].amount;
                            cash.cent1 += itemCash.cent1;
                            cash.cent5 += itemCash.cent5;
                            cash.cent10 += itemCash.cent10;
                            cash.cent25 += itemCash.cent25;
                            cash.cent50 += itemCash.cent50;
                            cash.ones += itemCash.ones;
                            cash.fives += itemCash.fives;
                            cash.tens += itemCash.tens;
                            cash.twenties += itemCash.twenties;
                            cash.fifties += itemCash.fifties;
                            cash.hundreds += itemCash.hundreds;
                        }
                    }
                    
                    ejs.renderFile('cash', { items: items, cash: cash, total: total }, function(template) {
                        $(template).popup().popup('open');
                        $.mobile.loading('hide');
                    });
                });
        });
}

function periodMenu_Change() {
    m_today = new Date($('#periodMenu').val());
    selectPeriod();
}

function btnCheck_Click() {
    m_primaryAccount.child('checks').once('value').then(function(snap) {
        var checks = snap.val();
        ejs.renderFile('checks', { checks: checks }, function(template) {
            var dialog = $(template);
            dialog.popup({
                history: false,
                overlayTheme: 'b',
                afteropen: function() {
                    for (var k in checks) {
                        $('#clear_' + k).on('click', { id: k }, clearCheck);
                    }
                }
            }).popup('open');
        });
    });
}

function btnLogout_Click(e) {
    e.preventDefault();
    firebase.auth().signOut();
}

function btnPrev_Click(e) {
    e.preventDefault();
    m_today = m_today.subtract("2 weeks");
    selectPeriod();
}

function btnNext_Click(e) {
    e.preventDefault();
    m_today = m_today.add("2 weeks");
    selectPeriod();
}

function app_AuthStateChanged(user) {
    if (user == null) {
        m_primaryAccount = null;
        ejs.renderFile('login', {} , function(template) {
            $('body').append(template); //.ready(loginInit);
        });
    } else {
        root()
            .child('accounts')
            .orderByChild('name')
            .equalTo('Primary')
            .once('child_added')
            .then(function(snap) {
                if (snap.val() != null) {
                    m_primaryAccount = snap.ref;
                } else {
                    // this is the first time login
                    m_primaryAccount = root().child('accounts').push();
                    m_primaryAccount.set({name: 'Primary'});
                }
                
                root().child('name').once('value', function(nsnap) {
                    if (nsnap.val() != null) { console.log("Running on", nsnap.val()); }
                });
                
                // setup the transaction listeners
                m_primaryAccount.child('transactions').on('child_changed', updateScreen);
                
                m_primaryAccount.child('periods').once('value', function(s)
                {
                    var periods = sortObjectByKey(s.val(), 'start'); 
                    render('index');
                    
                    for (var n = 0; n < periods.length; n++) {
                        $('#periodMenu').append(
                            $('<option>', { value: periods[n].start })
                                .text(
                                    Date.parseFb(periods[n].start).format('M/d') + "-" +
                                    Date.parseFb(periods[n].end).format('M/d/yyyy')
                                )
                        );
                    }
                
                    selectPeriod();
                });
            });
    }
}

function app_DoAuth(credentials, callback) {
    firebase.auth()
        .signInWithEmailAndPassword(credentials.email, credentials.password)
        .then(function(authData) {
            callback(null, authData);
        })
        .catch(function(err) {
            callback(err, null);
        });
}

    
function populateChart(snap) {
    var points = snap.val();
    var items = [];
    
    if (rendering == true) return;
    rendering = true;

    while (totals.length > 0) { totals.pop(); }
    while (transactions.length > 0) { transactions.pop(); }
    
    for (var k in points) {
        items.push({ data: points[k], key: k });
    }
    
    if (items.length <= 0) return;
    
    items.sort(function(o1, o2) {
        if (o1.data.date != o2.data.date) {
            return Date.parse(o1.data.date) - Date.parse(o2.data.date);
        }
        
        if (o1.data.category != o1.data.category) {
            return CATEGORIES.indexOf(o1.data.category) - CATEGORIES.indexOf(o2.data.category);
        }
        
        var tdata = [o1.data.name, o2.data.name];
        tdata.sort;
        if (o1.data.name == tdata[0]) {
            return -1;
        }
        return 1;
    });
    
    var dateDate = items[0].data.date;
    var dateTotal = items[0].data.total;
    var trDate = Date.parseFb(dateDate);
    var perStart = Date.parseFb(m_periodStart);
    for (var n = 0; n < items.length; n++) {
        trDate = Date.parseFb(dateDate);
        if (items[n].data.date != dateDate) {
            if ((trDate.ge(perStart.subtract('1 month'))) && (trDate.le(perStart.add('3 months')))) {
                totals.push({
                    x: Date.parseFb(dateDate),
                    y: dateTotal
                });
            }
            dateDate = items[n].data.date;
            dateTotal = items[n].data.total;
        }
        
        if (items[n].data.total < dateTotal) {
            dateTotal = items[n].data.total;
        }
        
        //transactions.push({
        //    x: new Date(Date.parse(items[n].data.date)),
        //    y: items[n].data.amount,
        //    label: items[n].data.category + ": " + items[n].data.name
        //});
    }
    if ((trDate.ge(perStart.subtract('1 month'))) && (trDate.le(perStart.add('3 months')))) {
        totals.push({
            x: new Date(Date.parse(dateDate)),
            y: dateTotal
        });
    }
    
    chart.render();
    rendering = false;
}

$('#chart_div').ready(function() {
    $('#chart_div').CanvasJSChart({
        zoomEnabled: true,
        axisX: {
            labelAngle: -30,
            gridThickness: 2
        },
        axisY: {
            includeZero: true,
            minimum: -1000,
            maximum: 5000
        },
        data: [
            { type: "stepArea", dataPoints: totals },
            { type: "scatter", dataPoints: transactions, visible:  false }
        ]
    });
    chart = $('#chart_div').CanvasJSChart();
});

// EOF
$().ready(Initialize);