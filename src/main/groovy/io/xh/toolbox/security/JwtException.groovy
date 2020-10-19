package io.xh.toolbox.security

import io.xh.hoist.exception.RoutineException

class JwtException extends RuntimeException implements RoutineException {
    JwtException(String message = 'Error processing JWT') {
        super(message)
    }
}
