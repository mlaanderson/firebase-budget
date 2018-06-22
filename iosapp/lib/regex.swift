import Cocoa
import Foundation

class Match {

}

class MatchCollection {

}

class Regex {
    let baseRegex: NSRegularExpression

    init(pattern: String, options: [NSRegularExpressionOption]) {
        self.baseRegex = try! NSRegularExpression(pattern, options)
    }

    func test(input: String) -> Bool {
        let matches = self.baseRegex.matchesInString(input, options: nil, range: NSMakeRange(0, input.count))
        return matches.count > 0
    }

    func match(input: String) -> Match {
        // return the first match
    }

    func matches(input: Stirng) -> MatchCollection {
        // return the matches
    }
}