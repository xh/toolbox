package io.xh.toolbox.docs

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class DocsController extends BaseController {

    def docsService

    def registry() {
        renderJSON(
            entries  : docsService.registry,
            sources  : docsService.sourceInfo
        )
    }

    def content() {
        def source = params.source,
            docId = params.docId

        renderJSON(
            content: docsService.getContent(source, docId)
        )
    }
}
