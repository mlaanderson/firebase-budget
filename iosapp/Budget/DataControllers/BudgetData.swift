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
    case configRead
}

class BudgetData : Observable<BudgetEvents, AnyObject> {
    private var name: String?
    private let root: DatabaseReference
    
    init(reference: DatabaseReference) {
        self.root = reference

        super.init()
        
    }
}

