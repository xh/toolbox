package io.xh.toolbox.docs

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class DocsController extends BaseController {

    def docsService

    def registry() {
        renderJSON(docsService.registry)
    }

    def content() {
        renderJSON(
            content: docsService.getContent(params.source, params.docId)
        )
    }
}
