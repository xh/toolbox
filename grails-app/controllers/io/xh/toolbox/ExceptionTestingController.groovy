package io.xh.toolbox

import io.xh.hoist.security.AccessAll
import org.springframework.http.HttpStatus

@AccessAll
class ExceptionTestingController extends BaseController {
    def throwException() {
        render(
            text: '{"exception": {"message": "This is an error in JSON format", "stackTrace": ["some", "stack", "trace"], "status": 500}}',
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            contentType: 'application/problem+json'
        )
    }
}
