import Firebase

class RecurringTransaction: Record {
    var amount: Double = 0.0
    var cash: Bool
    var category: String
    var end: String
    var name: String
    var note: String?
    var period: String
    var start: String
    var transfer: Bool

    var deposit : Bool {
        get { return value >= 0 }
    }

    init(snapshot: DatabaseSnapshot) {
        super(snapshot)
        if !self.fromObject(snapshot.value) return nil
    }

    init(data: [AnyHashable: Any]) {
        super(data)
        if !self.fromObject(data) return nil
    }

    private func fromObject(value: [AnyHashable: Any]) -> Bool {
        guard 
            let amount = value["amount"] as? Double,
            let category = value["category"] as? String,
            let end = value["end"] as? String,
            let name = value["name"] as? String,
            let period = value["period"] as? String,
            let start = value["start"] as? String
        else {
            return false
        }

        self.amount = amount
        self.category = category
        self.end = end
        self.name = name
        self.period = period
        self.start = start

        self.cash = value["cash"] as? Bool ?? false
        self.note = value["note"] as? String
        self.transfer = value["transfer"] as? Bool ?? false

        return true
    }

    func asObject() -> [AnyHashable: Any] {
        var result = [:]

        result["amount"] = self.amount
        result["category"] = self.category
        result["end"] = self.end
        result["name"] = self.name
        result["period"] = self.period
        result["start"] = self.start

        // nil values are ignored on the firebase end, just set them
        result["check"] = self.check
        result["note"] = self.note
        result["recurring"] = self.recurring

        // avoid storing false boolean values since nils are also parsed
        if self.cash { result["cash"] = true }
        if self.paid { result["paid"] = true }
        if self.transfer { result["transfer"] = true }

        return result
    }
}