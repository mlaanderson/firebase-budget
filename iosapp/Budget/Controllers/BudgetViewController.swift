//
//  BudgetViewController.swift
//  Budget
//
//  Created by Mike Kari Anderson on 6/9/18.
//  Copyright © 2018 Mike Kari Anderson. All rights reserved.
//

import UIKit

import Firebase
import FirebaseDatabase
import FirebaseAuth

class BudgetTableViewCell : UITableViewCell {
    var transaction: TransactionStruct!
    var formatter = NumberFormatter()

    
    @IBOutlet weak var dateTextLabel: UILabel!
    @IBOutlet weak var categoryTextLabel: UILabel!
    @IBOutlet weak var nameTextLabel: UILabel!
    @IBOutlet weak var amountTextLabel: UILabel!
    @IBOutlet weak var recurringTextLabel: UILabel!
    @IBOutlet weak var cashTextLabel: UILabel!
    
    func attachTransaction(_ transaction: TransactionStruct) -> Void {
        formatter.numberStyle = .currency
        formatter.allowsFloats = true;
        
        self.transaction = transaction
        
        self.nameTextLabel?.text = transaction.name
        self.categoryTextLabel?.text = transaction.category
        self.dateTextLabel?.text = transaction.date
        self.amountTextLabel?.text = self.formatter.string(from: transaction.amount as NSNumber)
        
        self.cashTextLabel?.text = transaction.cash ? "$" : ""
        self.recurringTextLabel?.text = transaction.recurring != nil ? "↻" : ""
    }
    
}

class BudgetController: UITableViewController {
    
    var config: ConfigurationStructure!
    var user : User!
    var ref : DatabaseReference!
    var primaryAccount : DatabaseReference!
    var transactionRef : DatabaseReference!
    var dateFormatter = DateFormatter()
    var periodStart : Date?
    var periodEnd : Date?
    var items: [TransactionStruct] = []
    var usedCategories = [String]()
    var aciveTransaction : TransactionStruct?
    
    private static var val_formatter : DateFormatter = DateFormatter()
    private static var initialized = false
    private static var formatter: DateFormatter {
        if !initialized {
            val_formatter.dateFormat = "MMM d"
            initialized = true
        }
        return val_formatter
    }
    
    
    func getUsedCategories() {
        var result = [String]()
        
        for item in self.items {
            if result.contains(item.category) == false {
                result.append(item.category)
            }
        }
        
        self.usedCategories = result
    }

    @IBOutlet weak var dateLabel: UIBarButtonItem!
    
    //MARK: Actions
    // Logout button handler
    @IBAction func logoutDidTouch(_ sender: UIBarButtonItem) {
        do {
            try Auth.auth().signOut()
            self.dismiss(animated: true, completion: nil)
        } catch (let error) {
            print("Auth signout error: \(error)")
        }
    }
    
    @IBAction func nextPreiodDidTouch(_ sender: UIBarButtonItem) {
        if self.config != nil {
            self.config.observe {
                self.transactionRef.removeAllObservers()
                
                self.loadPeriod(periodStart: self.periodStart! + self.config.periodLength)
            }
        }
    }
    
    @IBAction func prevPeriodDidTouch(_ sender: UIBarButtonItem) {
        if self.config != nil {
            self.config.observe {
                self.loadPeriod(periodStart: self.periodStart! - self.config.periodLength)
            }
        }
    }
    

    @IBAction func btnAddTransactionDidTouch(_ sender: UIBarButtonItem) {
        print("btnAddTransactionDidTouch")
    }
    
    //MARK: UITableView Delegate methods
    
    override func numberOfSections(in tableView: UITableView) -> Int {
        return self.usedCategories.count
    }
    
    override func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        return "\(self.usedCategories[section])"
    }
    
    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return self.items.filter( { item in
            return item.category == self.usedCategories[section]
        }).count
    }
    
    override func tableView(_ tableView: UITableView, commit editingStyle:  UITableViewCellEditingStyle, forRowAt indexPath: IndexPath) {
        
        print(editingStyle)
        
        let transaction = items.filter( { item in
            return item.category == self.usedCategories[indexPath.section]
        })[indexPath.row]
        
        if editingStyle == UITableViewCellEditingStyle.delete {
            transaction.ref?.removeValue()
        }
        
        
    }
    
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        self.aciveTransaction = items.filter( { item in
            return item.category == self.usedCategories[indexPath.section]
        })[indexPath.row]
        
        self.performSegue(withIdentifier: "transactionEditorSegue", sender: nil)
    }
    
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        if segue.identifier == "transactionEditorSegue" {
            if let transactionEditor = segue.destination as? TransactionEditorControler {
                transactionEditor.transaction = self.aciveTransaction
                transactionEditor.configuration = self.config
            }
        }
    }
    
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "ItemCell", for: indexPath) as! BudgetTableViewCell
        let transaction = items.filter( { item in
            return item.category == self.usedCategories[indexPath.section]
        })[indexPath.row]
        
        cell.attachTransaction(transaction)
        
        return cell
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.

        
        
        Auth.auth().addStateDidChangeListener() { auth, user in
            
            if user != nil {
                self.user = user
                self.ref = Database.database().reference(withPath: self.user.uid)
                
                self.ref.child("accounts").queryOrdered(byChild: "name").queryStarting(atValue: "Primary").queryEnding(atValue: "Primary").observeSingleEvent(of: .childAdded) { snapshot in
                    print(snapshot.key)
                    self.primaryAccount = snapshot.ref
                    self.transactionRef = self.primaryAccount.child("transactions")
                    
                    self.config = ConfigurationStructure(ref: self.ref)
                    
                    self.config.observe {
                        self.loadPeriod(periodStart: Date.periodCalc(start: self.config.periodStart, length: self.config.periodLength))
                    }
                }
            }
        }
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    // Data functions
    func loadPeriod(periodStart: Date) {
        self.periodStart = periodStart
        self.periodEnd = self.periodStart! + self.config.periodLength - "1 day"

        
        self.dateLabel.title = BudgetController.formatter.string(from: self.periodStart!) + " to " + BudgetController.formatter.string(from: self.periodEnd!)

        self.startListeners()
        self.loadTransactions()
    }
    
    func startListeners() -> Void {
        self.transactionRef.removeAllObservers()
        
        self.transactionRef.queryOrdered(byChild: "date").queryEnding(atValue: self.periodEnd?.toFbString()).observe(.childRemoved) { snapshot in
            // repopulate the list if the item is in this date range
            let transaction = TransactionStruct(snapshot: snapshot)
            
            if self.periodStart! <= transaction!.DateVal && transaction!.DateVal <= self.periodEnd! {
                self.loadTransactions()
            }
        }
    }
    
    func loadTransactions() {
        
        print("Loading transactions from \(self.periodStart!) to \(self.periodEnd!)")
        
        self.transactionRef.queryOrdered(byChild: "date").queryStarting(atValue: self.periodStart?.toFbString()).queryEnding(atValue: self.periodEnd?.toFbString()).observeSingleEvent(of: .value) { snapshot in
            
            let data : [String: Any] = snapshot.value as! [String: Any]
            self.items = []
            
            for (key, rec) in data {
                let record = TransactionStruct(ref: snapshot.ref.child(key), record: rec as! [String: Any])
                if record != nil {
                    self.items.append(record!)
                }
            }
            
            self.items.sort(by: { t1, t2 in
                if self.config.categories.index(of: t1.category)! < self.config.categories.index(of: t2.category)! { return true }
                if t1.category == t2.category && t1.name < t2.name { return true }
                return false
            })
            
            self.getUsedCategories()
            
            self.tableView.reloadData()
        }
    }
}
