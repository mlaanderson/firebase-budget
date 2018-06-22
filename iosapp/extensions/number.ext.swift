struct Cash {
    hundreds: Int = 0
    fifties: Int = 0
    twenties: Int = 0
    tens: Int = 0
    fives: Int = 0
    ones: Int = 0
    quarters: Int = 0
    dimes: Int = 0
    nickels: Int = 0
    pennies: Int = 0

    init() {}
    init(value: Double) {
        value = abs(value)

        while value >= 100.0 {
            value -= 100.0
            self.hundreds++
        }

        while value >= 50.0 {
            value -= 50.0
            self.fifties++
        }

        while value >= 20.0 {
            value -= 20.0
            self.twenties++
        }

        while value >= 10.0 {
            value -= 10.0
            self.tens++
        }

        while value >= 5.0 {
            value -= 5.0
            self.fives++
        }

        while value >= 1.0 {
            value -= 1.0
            self.ones++
        }

        while value >= 0.25 {
            value -= 0.25
            self.quarters++
        }

        while value >= 0.10 {
            value -= 0.10
            self.dimes++
        }

        while value >= 0.05 {
            value -= 0.05
            self.nickels++
        }

        while value >= 0.01 {
            value -= 0.01
            self.pennies++
        }
    }

    public func + (left: Cash, right: Cash) -> Cash {
        let result = Cash()
        result.hundreds = left.hundreds + right.hundreds
        result.fifties = left.fifties + right.fifties
        result.twenties = left.twenties + right.twenties
        result.tens = left.tens + right.tens
        result.fives = left.fives + right.fives
        result.ones = left.ones + right.ones
        result.quarters = left.quarters + right.quarters
        result.dimes = left.dimes + right.dimes
        result.nickels = left.nickels + right.nickels
        result.pennies = left.pennies + right.pennies

        return result
    }

    public func + (left: Cash, right: Double) -> Cash {
        return left + Cash(right)
    }

    public func + (left: Double, right: Cash) -> Cash {
        return Cash(left) + right
    }

    public func Double() : Double {
        return 
            Double(self.hundreds) * 100.0 +
            Double(self.fifties) * 50.0 +
            Double(self.twenties) * 20.0 +
            Double(self.tens) * 10.0 +
            Double(self.fives) * 5.0 +
            Double(self.ones) +
            Double(self.quarters) * 0.25 +
            Double(self.dimes) * 0.10 +
            Double(self.nickels) * 0.05 +
            Double(self.pennies) * 0.01
    }
}

extension Double {

    func Cash() : Cash {
        return Cash(self)
    }
}