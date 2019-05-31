package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.json.JSON
import io.xh.toolbox.NewsItem
import org.grails.web.json.JSONArray

import static io.xh.hoist.util.DateTimeUtils.MINUTES


class NewsService extends BaseService {

    public List<NewsItem> _newsItems

    static clearCachesConfigs = ['newsSources', 'newsApiKey']
    def configService

    void init() {
        createTimer(
                runFn: this.&loadAllNews,
                interval: 'newsRefreshMins',
                intervalUnits: MINUTES
        )
        super.init()
    }

    List<NewsItem> getNewsItems() {
        return _newsItems ?  _newsItems : Collections.emptyList()
    }


    //------------------------
    // For sample monitors
    //------------------------
    int getItemCount() {
        return _newsItems.size()
    }

    int getLoadedSourcesCount() {
        return _newsItems.collect{it.source}.unique().size()
    }

    boolean getAllSourcesLoaded() {
        return loadedSourcesCount == configService.getJSONObject('newsSources').size()
    }

    Date getLastTimestamp() {
        if (!_newsItems) return null
        return _newsItems.get(0).published
    }


    //------------------------
    // Implementation
    //------------------------
    private void loadAllNews() {
        def sources = configService.getJSONObject('newsSources') as Map<String, String>

        withShortInfo("Loading news from ${sources.size()} configured sources") {
            def items = []

            sources.each{code, displayName ->
                items.addAll(loadNewsForSource(code, displayName))
            }

            items.sort {-it.published.time}

            _newsItems = items
        }
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

    void clearCaches() {
        super.clearCaches()
        _newsItems = []
        loadAllNews()
    }

}
