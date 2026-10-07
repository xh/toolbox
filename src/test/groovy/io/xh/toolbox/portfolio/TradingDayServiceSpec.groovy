package io.xh.toolbox.portfolio

import grails.testing.services.ServiceUnitTest
import io.xh.hoist.test.HoistUnitTest
import spock.lang.Specification

import java.time.DayOfWeek
import java.time.LocalDate

/** Tests the calendar logic in {@link TradingDayService}. */
class TradingDayServiceSpec extends Specification implements ServiceUnitTest<TradingDayService>, HoistUnitTest {

    def 'the current trading day is never a weekend'() {
        expect:
        !(service.currentDay().dayOfWeek in [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY])
        service.currentDay() >= LocalDate.now()
        service.currentDay() <= LocalDate.now().plusDays(2)
    }

    def 'historical days run from the start of the prior year to the given day, weekdays only'() {
        given:
        def day = LocalDate.of(2026, 3, 4)   // a Wednesday

        when:
        def days = service.historicalDays(day)

        then:
        days.first() == LocalDate.of(2025, 1, 1)
        days.last() == day
        days.every { it.dayOfWeek != DayOfWeek.SATURDAY && it.dayOfWeek != DayOfWeek.SUNDAY }
        days == days.sort(false)
        days.size() == 261 + 45   // weekdays in 2025, plus Jan 1 - Mar 4 2026
    }

    def 'a weekend end date is excluded from its own history'() {
        given:
        def saturday = LocalDate.of(2026, 3, 7)

        expect:
        service.historicalDays(saturday).last() == LocalDate.of(2026, 3, 6)
    }
}
