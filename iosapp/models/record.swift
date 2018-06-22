import Firebase

class Record {
    var id: String?
    var ref: DatabaseReference?

    init(snapshot: DatabaseSnapshot) {
        self.ref = snapshot.ref
        self.id = snapshot.key
    }

    init(data: [AnyHashable: Any]) {
        self.id = nil
        self.ref = nil
    }

    func asObject() -> [AnyHashable: Any] {
        return [:]
    }
}
