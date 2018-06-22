import Firebase

class Transaction: Record {
    var amount: Double = 0.0
    var cash: Bool
    var category: String
    var check?: String
    var date: String
    var name: String
    var note: String?
    var paid: Bool
    var recurring: String?
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
            let date = value["date"] as? String,
            let name = value["name"] as? String
        else {
            return false
        }

        self.amount = amount
        self.category = category
        self.date = date
        self.name = name

        self.cash = value["cash"] as? Bool ?? false
        self.check = value["check"] as? String
        self.note = value["note"] as? String
        self.paid = value["paid"] as? Bool ?? false
        self.recurring = value["recurring"] as? String
        self.transfer = value["transfer"] as? Bool ?? false

        return true
    }

    func asObject() -> [AnyHashable: Any] {
        var result = [:]

        result["amount"] = self.amount
        result["category"] = self.category
        result["date"] = self.date
        result["name"] = self.name

        // nil values are ignored on the firebase end just set them
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