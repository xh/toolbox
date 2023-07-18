package io.xh.toolbox.news

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class NewsController extends BaseController {

    def newsService

    def index() {
        renderJSON(newsService.newsItems)
    }

}
