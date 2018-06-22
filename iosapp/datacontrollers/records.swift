import Foundation
import Firebase

enum RecordsEvents {
    childAdded,
    childAddedInPeriod,
    childAddedBeforePeriod,
    childChanged,
    beforeChildRemoved,
    childRemoved,
    childRemovedInPeriod,
    childRemovedBeforePeriod,
    childRemovedAfterPeriod,
    childSaved,
    periodLoaded
}

class Records<T where T: Record>: Observable<RecordsEvents, [T]> {
    internal let ref: DatabaseReference

    init(reference: DatabaseReference) {
        super()
        self.ref = reference

        self.ref.observe(.childAdded, with: self.childAddedHandler)
        self.ref.observe(.childChanged, with: self.childChangedHandler)
        self.ref.observe(.childRemoved, with: self.childRemovedHandler)
    }

    private func childAddedHandler(snapshot: DataSnapshot) {
        self.onChildAdded(T(snapshot))
    }

    private func childChangedHandler(snapshot: DataSnapshot) {
        self.onChildChanged(T(snapshot))
    }

    private func childRemovedHandler(snapshot: DataSnapshot) {
        self.onChildRemoved(T(snapshot))
    }


    internal func onChildAdded(record: T) {
        self.emit(.childAdded, [record])
    }

    internal func onChildChanged(record: T) {
        self.emit(.childChanged, record, nil)
    }

    internal func onChildRemoved(record: T) {
        self.emit(.childRemoved, record, nil)
    }

    internal func onBeforeChildRemoved(record: T) {
        self.emit(.beforeChildRemoved, record, nil)
    }

    internal func onChildSaved(record: T, original: T?) {
        self.emit(.childSaved, record, original)
    }

    func loadRecords(completion:@escaping ([T]) -> Void) {
        this.ref.observeSingleEvent(.value, with: { snapshot in 
            let result: [T] = []
            for child in snapshot.children {
                if let snapshot = child as? DataSnapshot,
                    let childItem = T(snapshot: snapshot) {
                        result.append(childItem)
                    }
            }
            completion(result)
        })
    }

    func loadRecordsByChild(child: String, startAt: Any?, endAt: Any?, completion:@escaping ([T]) -> Void) {
        var cRef = this.ref.queryOrderd(byChild: child)
        if startAt != nil {
            cRef = cRef.queryStarting(atValue: startAt)
        }
        if endAt != nil {
            cRef = cRef.queryEnding(atValue: endAt)
        }

        cRef.observeSingleEvent(.value, with: { snapshot in 
            let result: [T] = []
            for child in snapshot.children {
                if let snapshot = child as? DataSnapshot,
                    let childItem = T(snapshot: snapshot) {
                        result.append(childItem)
                    }
            }
            completion(result)
        })
    }

    func save(record: T, completion:@escaping (String) -> Void) {
        let saveData = record.asObject()
        if record.ref != nil {
            // updating an existing record
            record.ref.observeSingleEvent(.value, with: { snapshot
                let original = T(snapshot)
                record.ref.setValue(saveData)
                
                self.onChildSaved(record, original)

                completion(record.id)
            })
        } else {
            // creating a new record
            record.ref = self.ref.childByAutoId()
            record.id = record.ref.key
            record.ref.setValue(saveData)

            self.onChildSaved(record, nil)

            completion(record.id)
        }
    }

    func load(key: String, completion:@escaping (T) -> Void) {
        self.ref.child(key).observeSingleEvent(.value, with: { snapshot in 
            let record = T(snapshot)
            completion(record)
        })
    }

    func remove(record: T, completion:@escaping (String) -> Void) {
        self.onBeforeChildRemoved(record)

        record.ref.removeValue(with: { error, reference in
            completion(record.id)
        })
    }
}