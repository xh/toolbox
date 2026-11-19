package io.xh.toolbox.blueprints

import io.xh.hoist.exception.HttpException
import io.xh.hoist.exception.RoutineException

import static jakarta.servlet.http.HttpServletResponse.SC_BAD_REQUEST

/** A Blueprints data request that does not match the Data Catalog. */
class BlueprintRequestException extends HttpException implements RoutineException {
    BlueprintRequestException(String msg) {
        super(msg, null, SC_BAD_REQUEST)
    }
}
