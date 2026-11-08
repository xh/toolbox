package io.xh.toolbox.docs

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

import static io.xh.toolbox.docs.DocsService.versionsFrom

/** Docs API for the Toolbox docs viewers, backed by the Hoist Docs service via {@link DocsService}. */
@AccessAll
class DocsController extends BaseController {

    DocsService docsService

    def registry() {
        renderJSON(docsService.getRegistry(versionsFrom(params)))
    }

    def content() {
        String source = params.source
        renderJSON(content: docsService.getContent(source, params.docId as String, params[source] as String))
    }

    def search() {
        renderJSON(results: docsService.search(params.query as String, versionsFrom(params)))
    }
}
