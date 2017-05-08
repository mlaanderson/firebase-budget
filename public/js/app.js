var m_primaryAccount = null;
var m_totalLock = false;
var m_today;
var m_periodStart, m_periodEnd, m_lastPeriodStart;
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

var PERIOD_START = "2016-06-24";
var PERIOD_LENGTH = "2 weeks";

var chart_config = {
    "type": "serial",
    "balloonDateFormat": "MMM DD",
    "categoryField": "date",
    "dataDateFormat": "YYYY-MM-DD",
    "maxSelectedSeries": 0,
    "mouseWheelScrollEnabled": true,
    "zoomOutOnDataUpdate": false,
    "maxZoomFactor": 19,
    "zoomOutButtonTabIndex": -2,
    "sequencedAnimation": false,
    "startEffect": "bounce",
    "accessible": false,
    "autoDisplay": true,
    "hideBalloonTime": 2000,
    "theme": "dark",
    "categoryAxis": {
        "position": "top",
        "parseDates": true
    },
    "chartCursor": {
        "enabled": true,
        "animationDuration": 0.25,
        "bulletsEnabled": false,
        "categoryBalloonEnabled": false,
        "categoryBalloonAlpha": 0,
        "fullWidth": false,
        "leaveAfterTouch": false,
        "oneBalloonOnly": true,
        "selectionAlpha": 1
    },
    "chartScrollbar": {
        "enabled": true,
        "dragIcon": "dragIconRoundSmall",
        "graph": "AmGraph-1",
        "gridAlpha": 0,
        "maximum": 5000,
        "minimum": -500,
        "oppositeAxis": true,
        "selectedBackgroundAlpha": 0,
        "updateOnReleaseOnly": true
    },
    "trendLines": [],
    "graphs": [
        {
            "balloonColor": "#FFFFFF",
            "balloonText": "[[description]]",
            "bullet": "square",
            "bulletAxis": "ValueAxis-1",
            "bulletBorderAlpha": 1,
            "bulletField": "amount",
            "bulletHitAreaSize": 2,
            "color": "#000000",
            "colorField": "color",
            "columnWidth": 0,
            "descriptionField": "description",
            "fillAlphas": 0.18,
            "fillColorsField": "color",
            "id": "AmGraph-1",
            "lineAlpha": 1,
            "lineColorField": "color",
            "lineThickness": 2,
            "minDistance": 19,
            "switchable": false,
            "title": "graph 1",
            "type": "step",
            "valueAxis": "ValueAxis-1",
            "valueField": "amount"
        }
    ],
    "guides": [],
    "valueAxes": [
        {
            "id": "ValueAxis-1",
            "title": ""
        }
    ],
    "allLabels": [],
    "balloon": {
        "animationDuration": 0,
        "borderAlpha": 0.96,
        "disableMouseEvents": false,
        "fixedPosition": false,
        "horizontalPadding": 7
    },
    "titles": [],
    "dataProvider": []
};
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

function downloadJson() {
    root().once('value', function(snap) {
        var data = JSON.stringify(snap.val(), null, 4);
        var filename = 'budget-' + (new Date()).toFbString() + ".json"
        var blob  = new Blob([data], { type: 'application/json'});

        if (window.navigator.msSaveBlob) {
            window.navigator.msSaveBlob(blob, filename);
        } else {
            var elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;
            elem.style = "display: none";
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    });
}

function Initialize() {
    $.mobile.loading();
    
    firebase.auth().onAuthStateChanged(app_AuthStateChanged);
    
    m_today = Date.today();
    
    history.pushState({ today: m_today.toFbString() }, "", "");
    $(window).on('popstate', function(evt) {
        if ((evt.originalEvent.state) && (evt.originalEvent.state.today)) {
            evt.preventDefault();
            m_today = Date.parseFb(evt.originalEvent.state.today);
            selectPeriod();
        }
    });
    
    $('#btnLogout').on('click', btnLogout_Click);
    $('#btnPrev').on('click', btnPrev_Click);
    $('#btnNext').on('click', btnNext_Click);
    $('#btnCheck').on('click', btnCheck_Click);
    $('#periodMenu').on('change', periodMenu_Change);
    $('#btnCash').on('click', btnCash_Click);
    $('#btnAddTransaction').on('click', addTransaction);
    $('#btnEditTransaction').on('click', editSelectedTransaction);
    $('#btnNewRecurring').on('click', newRecurring);
    $('#btnDownload').on('click', downloadJson);
    $('#main').on('mouseout', function() {
        setTimeout(function() {
            $('#btnEditTransaction').prop('targetId', '');
        }, 150);
    });
    
    $(window).on('resize', function() {
        $('#main').css('max-height', ($(window).height() - $('[data-role=header]').height() - $('[data-role=footer]').height() - 4) + 'px');
        $('#main').css('height', ($(window).height() - $('[data-role=header]').height() - $('[data-role=footer]').height() - 4) + 'px');
    });
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
    m_primaryAccount
        .child('transactions')
        .once('value', function(snapshot) {
            var data = snapshot.val();
            
            m_primaryAccount.child('checks').once('value', function(csnap) {
                var checks = csnap.val();
                var sum = 0;
                var perSum = 0;

                var sums = {};
                
                data = sortObjectByKey(data, 'date', function(o1, o2) {
                    return Date.parse(o1.date) - Date.parse(o2.date);
                });

                for (var key in checks) {
                    if (false === "link" in checks[key]) {
                        sum = Math.roundTo(sum - checks[key].amount, 2);
                    }
                }
                
                while (totals.length > 0) { totals.pop(); }

                for (var n = 0; n < data.length; n++) {
                   sum = Math.roundTo(sum + data[n].amount, 2);
                   sums[data[n].date] = sum;
                   
                   if (Date.parse(data[n].date) <= Date.parse(m_periodEnd)) {
                       perSum = sum;
                   }
                }
                
                
                if ($('#footer_info').css('display') !== 'none') {
                    var perStart = Date.parseFb(m_periodStart);
                    var chStart, chLeft, chRight;
                    
                    // keep the zoom level the same, but base it on the current period
                    if (m_lastPeriodStart) {
                        chStart = Date.parseFb(m_lastPeriodStart);
                        var chLeftDiff = chStart.subtract(chart.startDate);
                        var chRightDiff = chart.endDate.subtract(chStart);
                        
                        chLeft = perStart.subtract(chLeftDiff);
                        chRight = perStart.add(chRightDiff);
                        
                    } else {
                        chStart = perStart;
                        chLeft = perStart.subtract('2 weeks');
                        chRight = perStart.add('3 months');
                    }
                    

                    chart.dataProvider = [];
                    for (var date in sums) {
                        var trDate = Date.parseFb(date);
                        chart.dataProvider.push({
                            "date": date,
                            "amount": sums[date],
                            "description": trDate.format("MMM dd") + ": " + sums[date].toCurrency(),
                            "color": (sums[date] < 0 ? "#ff0000" : "#008800")
                        });
                    }
                    
                    // chart.validateData();

                    // Adjust for AmCharts using the pixel position to determine negative values
                    //var chartStep = 1.5 * (chart.graphs[0].valueAxis.max - chart.graphs[0].valueAxis.min) / chart.categoryAxis.height;
                    //console.log(chartStep); 
                    //
                    //for (var n = 0; n < chart.dataProvider.length; n++) {
                    //    if (chart.dataProvider[n].amount > 0 && chart.dataProvider[n].amount < chartStep) {
                    //        // adjust the visual display
                    //        
                    //        chart.dataProvider[n].amount = chartStep;
                    //    }
                    //}

                    chart.validateData();
                    chart.zoomToDates(chLeft, chRight);
                }
                
                $('#main tfoot .trTotal').text(perSum.toCurrency())
            });
        });
}

function updateScreenChange(snapshot) {
    if (window.handleUpdate !== undefined) {
        updateRunningTotal();
        handleUpdate(snapshot, 'change');
    }
}

function updateScreenAdd(snapshot) {
    if (window.handleUpdate !== undefined) {
        updateRunningTotal();
        handleUpdate(snapshot, 'add');
    }
}

function updateScreenRemove(snapshot) {
    if (window.handleUpdate !== undefined) {
        updateRunningTotal();
        handleUpdate(snapshot, 'remove');
    }
}

function selectPeriod() {
    $.mobile.loading('show');
    $('*').blur();
    var start = m_today.periodCalc(PERIOD_START, PERIOD_LENGTH);
    var end = start.add(PERIOD_LENGTH).subtract("1 day").toFbString();

    start = start.toFbString();
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
                $('#main').css('max-height', ($(window).height() - $('[data-role=header]').height() - $('[data-role=footer]').height() - 4) + 'px');
                $('#main').css('height', ($(window).height() - $('[data-role=header]').height() - $('[data-role=footer]').height() - 4) + 'px');
                
                updateRunningTotal();
            });
        });
}

function saveTransaction(e) {
    $.mobile.loading('show');

    var isDeposit = $('#type').prop('checked');
    var checkNumber = $('#checkNumber').val();
    var checkLink = $('#checkLink').val();
    var note = $('#note').val();
    
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
    
    if (note === "") {
        note = null;
    }
    
    var data = {
        'date': $('#date').val(),
        'category': $('#category').val(),
        'name': $('#name').val(),
        'amount': $('#amount').val() * (isDeposit ? 1 : -1),
        'cash': $('#cash').prop('checked') && (isDeposit == false),
        'paid': $('#paid').prop('checked'), 
        'note': note
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

    m_primaryAccount.child('periods').orderByChild('start').limitToFirst(1).once('child_added', function(persnap) {
        if (Date.parseFb(data.date).lt(persnap.val().start) === true) {
            data.date = persnap.val().start;
        }

        if (e.data.id) {
            m_primaryAccount.child('transactions').child(e.data.id).once('value', function(snap) {
                var oldAmount = snap.val().amount;
                var oldCheckLink = snap.val().checkLink;
                
                
                if ((checkLink == "") && (oldCheckLink !== undefined)) {
                    // remove the links
                    m_primaryAccount.child('checks').child(oldCheckLink).child('link').remove();
                }

                m_primaryAccount.child('transactions').child(e.data.id).update(data).then(function() {
                    $('#transactionEditor').empty();
                    $('#transactionEditor').popup('close');
                    $('#transactionEditor').remove();
                    
                    $.mobile.loading('hide');
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
                $.mobile.loading('hide');
            });
        }
    });
    
    
}

function deleteTransaction(e) {
    if (e.data.id) {
        $.mobile.loading('show');
        m_primaryAccount.child('transactions').child(e.data.id).remove()
        .then(function() {
            $('#transactionEditor').empty();
            $('#transactionEditor').popup('close');
            $('#transactionEditor').remove();
            $.mobile.loading('hide');
        })
        .catch(function(err) {
            console.log(err);
        });
    }
}

function editSelectedTransaction(e) {
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
                    $('#btnSave').off('click').on('click', { id: transId }, saveTransaction);
                    $('#btnDelete').off('click').on('click', {id: transId }, deleteTransaction);
                    $('#transactionEditor input').off('keypress').on('keypress', function(evt) {
                        if (evt.charCode == 13) {
                            evt.preventDefault();
                            saveTransaction({
                                data: {
                                    id: transId
                                }
                            });
                        }
                    });
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
                $('#btnSave').off('click').on('click', { id: null }, saveTransaction);
            }
        }).popup('open');
    });
}

function previewTransaction(id) {
    $('#btnEditTransaction').prop('targetId', id);
    m_primaryAccount.child('transactions').child(id).once('value', function(tsnap) {
        var item = tsnap.val();
        if (item === null) return;
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
                    $('.info_div').empty().append($(template));
                });
            });
    });
}

function saveRecurring(e) {
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
    
    if ((e.data) && (e.data.id)) {
        var id = e.data.id;
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
                    var minDate = Date.max(Date.parseFb(data.start), Date.today());
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

                    //updateRunningTotal();
                    $('#recurringEditor').popup('close');
                    $('#recurringEditor').empty();
                    $('#recurringEditor').remove();
                    $.mobile.loading('hide');
                });
        });
    } else {
        // insert
        var ref = m_primaryAccount.child('recurring').push();
        ref.set(data).then(function() {
            var id = ref.key;
            
            var minDate = Date.max(Date.parseFb(data.start), Date.today());
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
            
            //updateRunningTotal();
            $('#recurringEditor').popup('close');
            $('#recurringEditor').empty();
            $('#recurringEditor').remove();
            $.mobile.loading('hide');
        });
    }
}


function deleteRecurring(e) {
    console.log(e.data);

    $.mobile.loading('show');

    m_primaryAccount.child('transactions')
        .orderByChild('recurring')
        .startAt(e.data.id)
        .endAt(e.data.id)
        .once("value", function(snap) {
            var transactions = snap.val();
            for (var key in transactions) {
                if (Date.parseFb(transactions[key].date).ge(m_periodStart) == true) {
                    m_primaryAccount.child('transactions').child(key).remove();
                }
            }
            $('#recurringEditor').popup('close');
            $('#recurringEditor').empty();
            $('#recurringEditor').remove();
            $.mobile.loading('hide');
        });

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
                    $('#btnSave').off('click').on('click', { id: transId }, saveRecurring);
                    $('#btnDelete').off('click').on('click', { id: transId }, deleteRecurring);
                }
            }).popup('open');
        });
    });
}

function newRecurring() {
    ejs.renderFile('editrecurring', {
        start: m_today.toFbString(),
        end: m_today.add('1 year').toFbString(),
        amount: 0,
        category: CATEGORIES[0],
        name: '',
        cash: false,
        period: '1 month'
    }, function(template) {
        var dialog = $(template)
        .popup({
            history: false,
            overlayTheme: 'b',
            afteropen: function() {
                $('#btnSave').off('click').on('click', saveRecurring);
            }
        }).popup('open');
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
    history.pushState({ today: m_today.toFbString()}, document.title, "");
    m_today = Date.parseFb($('#periodMenu').val());
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
                        $('#clear_' + k).off('click').on('click', { id: k }, clearCheck);
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
    history.pushState({ today: m_today.toFbString()}, document.title, "");
    m_today = m_today.subtract(PERIOD_LENGTH);
    selectPeriod();
}

function btnNext_Click(e) {
    e.preventDefault();
    history.pushState({ today: m_today.toFbString()}, document.title, "");
    m_today = m_today.add(PERIOD_LENGTH);
    selectPeriod();
}

function app_AuthStateChanged(user) {
    if (user == null) {
        m_primaryAccount = null;

        // clear the chart
        //while (totals.length > 0) { totals.pop(); }
        //chart.render();
        $('#main table').remove();
        
        ejs.renderFile('login', {} , function(template) {
            $('body').append(template); //.ready(loginInit);
        });
    } else {
        root()
            .child('config')
            .on('value', function(snap) {
                // get/update the configuration information
                var config = snap.val();
                
                if (config == null) {
                        root().child('config/categories').set(CATEGORIES[n]);
                } else {
                    CATEGORIES = config.categories;
                    if (config.periods !== undefined) {
                        PERIOD_START = config.periods.start || "2016-06-24";
                        PERIOD_LENGTH = config.periods.length || "2 weeks";
                    }
                }
            });
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
                m_primaryAccount.child('transactions').on('child_changed', updateScreenChange);
                m_primaryAccount.child('transactions').on('child_added', updateScreenAdd);
                m_primaryAccount.child('transactions').on('child_removed', updateScreenRemove);

                render("index");
                for (var dateStart = Date.parseFb(PERIOD_START); dateStart.lt(m_today.add("5 years")); dateStart = dateStart.add(PERIOD_LENGTH)) {
                    $('#periodMenu').append(
                        $('<option>', { value: dateStart.toFbString() }).text(
                            dateStart.format('M/d') + "-" + 
                            dateStart.add(PERIOD_LENGTH).subtract("1 day").format('M/d/yyyy')
                        )
                    );
                }


                $('#periodMenu').children().each(function(n, el) {
                    var opt = $(el); 
                    if (Date.parseFb(opt.val()).lt(PERIOD_START) === true) { 
                        opt.remove(); 
                    } 
                });

                if (m_today.lt(PERIOD_START) === true) {
                    m_today = Date.parseFb(PERIOD_START);
                }
                selectPeriod();

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

function navigateTo(transId) {
    m_primaryAccount.child('transactions').child(transId).once('value', function(snap) {
        var tr = snap.val();
        if (tr !== null) {
            history.pushState({ today: m_today.toFbString()}, document.title, "");
            m_today = Date.parseFb(tr.date);
            selectPeriod();
        }
    });
}

function archive(allButPeriod) {
    var stopDate = Date.today().subtract(allButPeriod).periodCalc(PERIOD_START, PERIOD_LENGTH);
    m_primaryAccount.child('transactions').orderByChild("date").endAt(stopDate.toFbString()).once("value", (snap) => {
        var summedValues = {};
        var vals = snap.val();
        var archivedValues = vals;

        for (var key in vals) {
            var tr = vals[key];
            if (summedValues[tr.category] === undefined) {
                // add the category
                summedValues[tr.category] = {}
            }

            if (summedValues[tr.category][tr.name] === undefined) {
                summedValues[tr.category][tr.name] = {
                    category: tr.category,
                    name: tr.name,
                    date: stopDate.subtract("1 day").toFbString(),
                    amount: Math.roundTo(tr.amount,2),
                    paid: true
                };
            } else {
                summedValues[tr.category][tr.name].amount = Math.roundTo(summedValues[tr.category][tr.name].amount + tr.amount, 2);
            }
            m_primaryAccount.child('transactions').child(key).remove();
        }

        for (var category in summedValues) {
            for (var name in summedValues[category]) {
                m_primaryAccount.child('transactions').push(summedValues[category][name]);
            }
        }

        for (var key in vals) {
            m_primaryAccount.child('archives').push(vals[key]);
        }

        root().child('config/periods/start').set(stopDate.toFbString());
        PERIOD_START = stopDate.toFbString();

    });
}

$('#chart_div').ready(function() {
    chart = AmCharts.makeChart('chart_div', chart_config);
});

// EOF
$().ready(Initialize);