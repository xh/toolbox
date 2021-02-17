package io.xh.toolbox.portfolio

import com.thedeanda.lorem.Lorem
import com.thedeanda.lorem.LoremIpsum

class Utils {
    static Random random = new Random()
    static Lorem lorem = LoremIpsum.getInstance()

    static int randInt(int lower, int upper) {
        return random.nextInt(upper - lower) + lower
    }

    static double randDouble(Number lower, Number upper) {
        return random.nextDouble() * (upper - lower) + lower
    }

    static <T> T sample(List<T> list) {
        int idx = random.nextInt(list.size())
        return list[idx]
    }

    static String loremWords(Number lower = 10, Number upper = 100) {
        return lorem.getWords(lower, upper)
    }
}
