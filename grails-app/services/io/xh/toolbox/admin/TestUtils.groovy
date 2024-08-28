package io.xh.toolbox.admin

import static io.xh.toolbox.portfolio.Utils.randInt
import static io.xh.toolbox.portfolio.Utils.sample

class TestUtils {
    static Long generatePrice() {
        Math.round(Math.random() * 1000)
    }

    static String generateSymbol() {
        def ret = '',
            n = randInt(1, 6),
            letters = ('A'..'Z') as List<Character>
        n.times {
            ret += sample(letters)
        }
        return ret
    }

    static List generateResultSet() {
        1000.collect {
            [generateSymbol(), generatePrice(), generatePrice()]
        }
    }

}

