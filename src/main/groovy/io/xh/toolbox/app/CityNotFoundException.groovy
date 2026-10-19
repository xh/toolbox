package io.xh.toolbox.app

import io.xh.hoist.exception.NotFoundException
import io.xh.hoist.exception.RoutineException

/**
 * A city the weather service does not know - a 404, but routine, as a user or the Dashboard Agent
 * can mistype a city. Hoist logs it briefly, with no stack trace, and the client does not report
 * it as an error.
 */
class CityNotFoundException extends NotFoundException implements RoutineException {
    CityNotFoundException(String city) {
        super("No weather found for '$city'.")
    }
}
