import Foundation

class Observable<T where T: enum, U> {
    private var observers: [T:[(record: U?, original: U?) -> Void]] = [:]

    func observe(event: T, observer:@escaping (record: U?, original: U?) -> Void) {
        if let observerList = self.observers[event] {
            observerList.append(observer)
        } else {
            self.observers[T] = [observer];
        }
    }

    internal func emit(event: T, record: U?, original: U?) {
        if let observerList = self.observers[event] {
            for observer in observerList {
                observer(record, original)
            }
        }
    }
}