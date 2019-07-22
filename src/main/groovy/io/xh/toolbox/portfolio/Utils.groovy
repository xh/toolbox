package io.xh.toolbox.portfolio

class Utils {
    static Random random = new Random()

    static int randInt(int lower, int upper) {
        return random.nextInt(upper - lower) + lower
    }

    static double randDouble(Number upper, Number lower) {
        return random.nextDouble() * (upper - lower) + lower
    }

    static def sample(List list) {
        int idx = random.nextInt(list.size())
        return list[idx]
    }
}
