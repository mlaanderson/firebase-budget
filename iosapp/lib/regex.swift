import Cocoa
import Foundation

class Match {

}

class MatchCollection {

}

class Regex {
    let baseRegex: NSRegularExpression

    init(pattern: String, options: [NSRegularExpressionOption]) {
        self.baseRegex = try! NSRegularExpression(pattern: pattern, options: options)
    }

    func isMatch(input: String) -> Bool {
        let matches = self.baseRegex.matchesInString(input, options: nil, range: NSMakeRange(0, input.count))
        return matches.count > 0
    }

    func match(input: String) -> Match {
        // return the first match
        let matches = self.baseRegex
    }

    func matches(input: String) -> MatchCollection {
        // return the matches
    }
}