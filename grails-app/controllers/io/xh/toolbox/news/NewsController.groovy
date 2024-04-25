package io.xh.toolbox.news

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class NewsController extends BaseController {

    def newsService

    def index() {
        def items = newsService.newsItems
        renderJSON(items)
    }

}
