
import Firebase

class Transactions : Records<Transaction> {
    private var records: [String:Transaction] = [:]
    private var recordList: [Transaction] = []
    private var periodStart: String?
    private var periodEnd: String?

    init(reference: DatabaseReference) {
        super(reference)
    }

    private func inPeriod(date: String) -> Bool {
        guard self.periodStart, self.periodEnd else {
            return false
        }
        return self.periodStart <= date && date <= self.periodEnd
    }

    // don't need to sort since the view does that for us
    private func populateTransactionList() {
        self.recordList = Array(self.records.values)
    }

    override func onChildAdded(record: Transaction) {
        guard self.periodStart, self.periodEnd else {
            return
        }

        if self.inPeriod(record.date) {
            self.records[record.id] = record
            self.populateTransactionList()

            self.emit(.childAddedInPeriod, record, nil)
        } else if record.date < self.periodStart {
            self.emit(.childAddedBeforePeriod, record, nil)
        }

        super.onChildAdded(record)
    }

    override func onChildChanged(record: Transaction) {
        guard self.periodStart, self.periodEnd else {
            return
        }

        if self.inPeriod(record.date) {
            self.records[record.id] = record
            self.populateTransactionList()

            self.emit(.childChangedInPeriod, record, nil)
        } else {
            if let rec = self.records.removeValue(forKey: record.id) {
                self.populateTransactionList()
            }
        }

        self.emit(.childChanged, [record])
    }

    override func onChildRemoved(record: Transaction) {
        guard self.periodStart, self.periodEnd else {
            return
        }

        if let rec = self.records.removeValue(forKey: record.id) {
            self.populateTransactionList();
        }

        if self.inPeriod(record.date) {
            self.emit(.childRemovedInPeriod, record, nil)
        } else if record.date < self.periodStart {
            self.emit(.childRemovedBeforePeriod, record, nil)
        }

        self.emit(.childRemove, record, nil)
    }

    override func onChildSaved(current: Transaction, original: Transaction) {
        guard self.periodStart, self.periodEnd else {
            return
        }

        if self.inPeriod(current.id) {
            self.records[current.id] = current
        } else {
            self.records.removeValue(forKey: current.id)
        }
    }

    public Records: [String:Transaction] {
        get { return self.records }
    }

    public List: [Transaction] {
        get { return self.recordList }
    }

    public Start: String {
        get { return self.periodStart }
    }

    public End: String {
        get { return self.periodEnd }
    }

    public Cash: Cash {
        get {
            var result = Cash()
            for record in (self.recordList.filter { $0.cash && !$0.paid  && !$0.deposit }) {
                result += self.amount
            }
            return result
        }
    }


    public Transfer: Double {
        get {
            var result = 0
            for record in (self.recordList.filter { $0.transfer && !$0.paid }) {
                result -= record.amount
            }
            return result
        }
    }

    public func getSame(record: Transaction, completion:@escaping ([Transaction]) -> Void) {
        self.loadRecordsByChild("name", record.name, record.name, with: { records in 
            let result = Array(records.values).filter { $0.category = record.category }
            completion(result)
        })
    }

    public func loadPeriod(start: String, end: String, completion:@escaping ([String:Transaction]) -> Void) {
        self.loadRecordsByChild("date", start, end, with { records in 
            self.records = records
            self.populateTransactionList()
            self.periodStart = start
            self.periodEnd = end

            completion(self.records)
            self.emit(.periodLoaded, nil, nil)
        })
    }

    public func getRecurring(id: String, completion:@escaping ([String:Transaction]) -> Void) {
        self.loadRecordsByChild('recurring', id, id, completion)
    }

    public func getTotal(completion:@escaping (Double) -> Void) {
        guard self.periodStart, self.periodEnd else {
            completion(0.0)
            return
        }

        self.loadRecordsByChild('date', nil, self.periodEnd) { records in
            let total = Array(records.values).reduce(0.0, +)
            completion(total)
        }
    }

    // TODO SEARCH
}