package io.xh.toolbox.news

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class NewsController extends BaseController {

    def newsService

    def index() {
        def items = newsService.newsItems
        renderJSON(items)
    }

    def shortNews(String newsType) {
        log.info(newsType)
        def items = newsService.newsItems
        renderJSON(items.subList(0,5))
    }

}
