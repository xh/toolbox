package io.xh.toolbox.portfolio

import io.xh.hoist.BaseService

import java.time.DayOfWeek
import java.time.LocalDate

import static java.time.DayOfWeek.SATURDAY
import static java.time.DayOfWeek.SUNDAY

class TradingDayService extends BaseService {

    LocalDate currentDay() {
        def today = LocalDate.now()
        switch (today.dayOfWeek) {
            case SATURDAY: return today.plusDays(2)
            case SUNDAY: return today.plusDays(1)
            default: return today
        }
    }

    List<LocalDate> historicalDays(LocalDate day) {
        List<LocalDate> ret = []
        LocalDate startDay = LocalDate.of(day.getYear() - 1, 1, 1)
        for (LocalDate d = startDay; d <= day; d = d.plusDays(1)) {
            DayOfWeek dow = d.dayOfWeek
            if (dow != SATURDAY && dow != SUNDAY) ret << d
        }
        return ret
    }
}
