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
    ready,
    loadPeriod
}

class BudgetData : Observable<BudgetEvents, AnyObject> {
    private let root: DatabaseReference
    private var account: DatabaseReference = nil
    private var isReady: Bool
    private var readyPromise: Promise<Bool>
    private var period: Period?
    
    var config: Configuration = nil
    var transactions: Transactions = nil
    var recurrings: RecurringTransactions = nil


    init(_ reference: DatabaseReference) {
        self.root = reference
        self.readyPromise = Promise<Bool>() { resolve, reject in }

        super.init()
        
        self.root.child("config").observeSingleEvent(of: .value) { snapshot in 
            self.config = Configuration(snapshot)

            // find the root account
            self.root.child("config").queryOrdered(byChild: "name").queryStarting(atValue: "Primary").queryEnding(atValue: "Primary").observeSingleEvent(of: .childAdded) { snapshot in
                self.account = snapshot.ref
                self.transactions = Transactions(snapshot.child("transactions"))
                self.recurrings = RecurringTransactions(snapshot.child("recurring"))
            }

            self.emit(.configRead)
        }
    }

    func ready() -> Promise<Bool> {
        return self.readyPromise
    }

    func gotoDate(_ date: Date) {
        self.period = self.config.calculatePeriod(date)

        self.transactions.loadPeriod(self.period.start, self.period.end) { transactions in 
            self.emit(.loadPeriod)

            if (self.isReady == false) {
                self.isReady = true;
                self.readyPromise.resolve(true)
            }
        }
    }

    func saveTransaction(_ transaction: Transaction)  {
        self.transactions.save(transaction) { id in
            // populate for undo/redo
        }
    }

    func removeTransaction(_ transaction: Transaction) {
        self.transactions.remove(transaction) { id in 
            // populate for undo/redo
        }
    }

    func saveRecurring(_ transaction: RecurringTransaction) {
        self.recurrings.save(transaction) { id in 
            var date = Date.periodCalc(self.config.start, self.config.length).toFbString()

            if date < self.period.start {
                date = self.period.start
            }

            self.transactions.getRecurring(id) { transactions in 
                let toDelete = transactions.values.filter({ $0.date >= date && !$0.paid })
                for tr in toDelete {
                    self.transactions.remove(tr)
                }
            }

            for tDate in Date.range(start: date, end: transaction.end, period: transaction.length) {
                if (tDate >= self.period.start) {
                   var object = [AnyHashable:Any]()
                   object["amount"] = transaction.amount
                   object["cash"] = transaction.cash
                   object["category"] = transaction.category
                   object["date"] = tDate.toFbString()
                   object["name"] = transaction.name
                   object["note"] = transaction.note
                   object["recurring"] = id
                   object["transfer"] = transaction.transfer
                   self.transactions.save(Transaction(object))
                }
            }
        }
    }

    func removeRecurring(_ transaction: RecurringTransaction) {
        self.recurrings.save(transaction) { id in 
            var date = Date.periodCalc(self.config.start, self.config.length).toFbString()

            if date < self.period.start {
                date = self.period.start
            }

            self.transactions.getRecurring(id) { transactions in 
                let toDelete = transactions.values.filter({ $0.date >= date && !$0.paid })
                for tr in toDelete {
                    self.transactions.remove(tr)
                }
            }
        }
    }
}

