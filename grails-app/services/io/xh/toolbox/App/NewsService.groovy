package io.xh.toolbox.App

import io.xh.hoist.json.JSON

import io.xh.toolbox.NewsItem
import org.grails.web.json.JSONArray


import static io.xh.hoist.util.DateTimeUtils.MINUTES


class NewsService extends io.xh.hoist.BaseService {

    public List<NewsItem> _newsItems

    static clearCachesConfigs = ['newsSources', 'newsApiKey', 'newsRefreshMins']
    def configService

    void init() {
        createTimer(
                runFn: this.&loadAllNews,
                interval: configService.getInt('newsRefreshMins'),
                intervalUnits: MINUTES
        )
        super.init()
    }

    List<NewsItem> getNewsItems() {
        return _newsItems ? _newsItems.sort{-it.published.time} : Collections.emptyList()
    }

    void clearCaches() {
        _newsItems = []
        super.clearCaches()

        loadAllNews()
    }


    //------------------------
    // Implementation
    //------------------------
    private void loadAllNews() {
        def sources = configService.getJSONObject('newsSources')

        withShortInfo("Loading news from ${sources.size()} configured sources") {
            def items = []

            sources.each{code, displayName ->
                items.addAll(loadNewsForSource(code, displayName))
            }

            _newsItems = items
        }
    }

    private int countStories() {
        return _newsItems.size()
    }

    private Date getLastTimestamp() {
        if (!_newsItems) return null
        return _newsItems.sort{-it.published.time}.get(0).published
    }

    private boolean sourcesLoaded() {
        def sourcesCount = configService.getJSONObject('newsSources').size(),
            loadedSourcesCount = countSourcesLoaded()

        return loadedSourcesCount == sourcesCount
    }

    private int countSourcesLoaded() {
        return _newsItems.collect{it.source}.unique().size()
    }

    private List<NewsItem> loadNewsForSource(String sourceCode, String sourceDisplayName) {
        def apiKey = configService.getString('newsApiKey'),
            url = new URL("https://newsapi.org/v1/articles?source=${sourceCode}&apiKey=${apiKey}"),
            response = JSON.parse(url.openStream(), 'UTF-8')

        if (response.status != 'ok') {
            log.error("Unable to fetch news for ${sourceCode}: ${response.message}")
            return Collections.emptyList()
        }

        def articles = response.articles as JSONArray,
            ret = []

        articles.forEach{it ->
            if (it.publishedAt) {
                def cleanPubString = it.publishedAt.take(19) + 'Z'
                ret << new NewsItem(
                        source: sourceDisplayName,
                        title: it.title,
                        author: it.author,
                        text: it.description,
                        url: it.url,
                        imageUrl: it.urlToImage,
                        published: Date.parse("yyyy-MM-dd'T'HH:mm:ssX", cleanPubString)
                )
            }
        }

        log.debug("Loaded ${ret.size()} news items from ${sourceCode}")
        return ret
    }

}
