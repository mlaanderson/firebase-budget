//
//  Observable.swift
//  Budget
//
//  Created by Mike Kari Anderson on 6/23/18.
//  Copyright © 2018 Mike Kari Anderson. All rights reserved.
//

import Foundation

class Observable<T: RawRepresentable, U> where T.RawValue == Int {
    private var observers: [Int:[(_ record: U?, _ original: U?) -> Void]] = [:]
    
    func observe(_ event: T, observer:@escaping (_ record: U?, _ original: U?) -> Void) {
        if var observerList = self.observers[event.rawValue] {
            observerList.append(observer)
        } else {
            self.observers[event.rawValue] = [observer];
        }
    }
    
    internal func emit(event: T, record: U?, original: U?) {
        if let observerList = self.observers[event.rawValue] {
            for observer in observerList {
                observer(record, original)
            }
        }
    }
}
