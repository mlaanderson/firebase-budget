//
//  TransactionEditorController.swift
//  Budget
//
//  Created by Mike Kari Anderson on 6/18/18.
//  Copyright © 2018 Mike Kari Anderson. All rights reserved.
//

import Foundation
import UIKit

class TransactionEditorControler: UITableViewController, UIPickerViewDelegate, UIPickerViewDataSource {

    private var dateCellExpanded: Bool = false
    private var catCellExpanded: Bool = false
    
    private static var val_formatter : DateFormatter = DateFormatter()
    private static var initialized = false
    private static var formatter: DateFormatter {
        if !initialized {
            val_formatter.dateFormat = "MMM d, yyyy"
            initialized = true
        }
        return val_formatter
    }
    private static var numberFormatter = NumberFormatter()

    
    var transaction: TransactionStruct?
    var configuration: ConfigurationStructure?
    
    @IBOutlet weak var datePicker: UIDatePicker!
    @IBOutlet weak var lblDate: UILabel!
    @IBOutlet weak var lblCategory: UILabel!
    @IBOutlet weak var categoryPicker: UIPickerView!
    @IBOutlet weak var txtName: UITextField!
    @IBOutlet weak var swDeposit: UISwitch!
    @IBOutlet weak var swCash: UISwitch!
    @IBOutlet weak var swTransfer: UISwitch!
    @IBOutlet weak var txtCheck: UITextField!
    @IBOutlet weak var txtAmount: UITextField!
    @IBOutlet weak var swPaid: UISwitch!
    @IBOutlet weak var txtNote: UITextView!
    
    func numberOfComponents(in pickerView: UIPickerView) -> Int {
        return 1
    }
    
    func pickerView(_ pickerView: UIPickerView, numberOfRowsInComponent component: Int) -> Int {
        return configuration!.categories.count
    }
    
    func pickerView(_ pickerView: UIPickerView, titleForRow row: Int, forComponent component: Int) -> String? {
        return configuration!.categories[row]
    }
    
    func pickerView(_ pickerView: UIPickerView, didSelectRow row: Int, inComponent component: Int) {
        if self.transaction != nil && self.configuration != nil {
            transaction?.category = (configuration?.categories[row])!
            lblCategory.text = "Category: " + (self.configuration?.categories[row])!
        }
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        TransactionEditorControler.numberFormatter.allowsFloats = true;
        TransactionEditorControler.numberFormatter.numberStyle = .currency
        
        tableView.tableFooterView = UIView()
        
        // set the loaded transaction
        if self.transaction != nil {
            self.datePicker.date = Date.parseFb(value: (self.transaction?.date)!)!
            lblDate.text = "Date: " + TransactionEditorControler.formatter.string(from: self.datePicker.date)
            lblCategory.text = "Category: " + (transaction?.category)!
        
            if self.configuration != nil {
                if let idx = self.configuration?.categories.index(of: (self.transaction?.category)!) {
                    self.categoryPicker.selectRow(idx, inComponent: 0, animated: false)
                }
                
                self.categoryPicker.dataSource = self
                self.categoryPicker.delegate = self
            }
            
            txtName.text = transaction!.name
            swDeposit.isOn = transaction!.amount > 0
            swCash.isOn = transaction!.cash
            swTransfer.isOn = transaction!.transfer
            txtCheck.text = transaction?.check ?? ""
            txtAmount.text = TransactionEditorControler.numberFormatter.string(from: transaction!.amount as NSNumber)
            swPaid.isOn = transaction!.paid
            txtNote.text = transaction?.note ?? ""
        }
    }
    
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        if (indexPath.row == 1) {
            self.dateCellExpanded = !self.dateCellExpanded
            
            tableView.beginUpdates()
            tableView.endUpdates()
        }
        
        if (indexPath.row == 2) {
            self.catCellExpanded = !self.catCellExpanded
            
            tableView.beginUpdates()
            tableView.endUpdates()
        }
    }
    
    override func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        if indexPath.row == 1 {
            if self.dateCellExpanded {
                return 250
            } else {
                if self.transaction != nil {
                    // update the transaction date
                    self.transaction!.date = self.datePicker.date.toFbString()
                    lblDate.text = "Date: " + TransactionEditorControler.formatter.string(from: self.datePicker.date)
                }
            }
        }
        if indexPath.row == 2 {
            if self.catCellExpanded {
                return 250
            }
        }
        if indexPath.row == 10 {
            return 200
        }
        
        return 50
    }
    
    //MARK: Actions
    
    @IBAction func datePicker(_ sender: UIDatePicker) {
        self.transaction!.date = self.datePicker.date.toFbString()
        lblDate.text = "Date: " + TransactionEditorControler.formatter.string(from: self.datePicker.date)
    }
    
    @IBAction func cancelDidTouch(_ sender: UIBarButtonItem) {
        self.dismiss(animated: true)
    }
    
    @IBAction func saveDidTouch(_ sender: UIBarButtonItem) {
    }
}
