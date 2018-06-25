//
//  BudgetData.swift
//  BudgetData
//
//  Created by Mike Kari Anderson on 6/24/18.
//  Copyright © 2018 Mike Kari Anderson. All rights reserved.
//

import Foundation
import Firebase

enum BudgetEvents: Int {
    case configRead, 
    ready
}

class BudgetData : Observable<BudgetEvents, AnyObject> {
    private let root: DatabaseReference
    private var account: DatabaseReference = nil
    
    var config: Configuration = nil
    var transactions: Transactions = nil
    var recurring: RecurringTransactions = nil

    init(reference: DatabaseReference) {
        self.root = reference

        super.init()
        
        self.root.child("config").observeSingleEvent(of: .value) { snapshot in 
            self.config = Configuration(snapshot)

            // find the root account
            self.root.child("config").queryOrdered(byChild: "name").queryStarting(atValue: "Primary").queryEnding(atValue: "Primary").observeSingleEvent(of: .childAdded) { snapshot in
                self.account = snapshot.ref
                self.transactions = Transactions(snapshot.child("transactions"))
                self.recurring = RecurringTransactions(snapshot.child("recurring"))
            }

            self.emit(.configRead)
        }
    }

}

