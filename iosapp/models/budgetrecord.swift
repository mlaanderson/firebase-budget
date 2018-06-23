//
//  Transaction.swift
//  Budget
//
//  Created by Mike Kari Anderson on 6/23/18.
//  Copyright © 2018 Mike Kari Anderson. All rights reserved.
//

import Firebase

class BudgetRecord {
    var id: String?
    var ref: DatabaseReference?
    
    init?(_ snapshot: DataSnapshot) {
        self.ref = snapshot.ref
        self.id = snapshot.key
    }
    
    init?(data: AnyObject) {
        self.id = nil
        self.ref = nil
    }
    
    func asObject() -> [AnyHashable: Any] {
        return [:]
    }
}
