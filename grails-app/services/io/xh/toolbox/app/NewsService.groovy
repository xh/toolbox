package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.http.JSONClient
import io.xh.toolbox.NewsItem
import org.apache.http.client.methods.HttpGet
import io.xh.hoist.util.Timer

import static io.xh.hoist.util.DateTimeUtils.MINUTES


class NewsService extends BaseService {

    private List<NewsItem> _newsItems
    private Timer newsTimer
    private JSONClient _jsonClient

    static clearCachesConfigs = ['newsSources', 'newsApiKey']
    def configService

    List<NewsItem> getNewsItems() {
        // to avoid hitting the API too frequently, we only start our timer when the NewsService is actually used.
        if (!newsTimer) {
            newsTimer = createTimer(
                    runFn: this.&loadAllNews,
                    interval: 'newsRefreshMins',
                    intervalUnits: MINUTES,
                    runImmediatelyAndBlock: true
            )
        }
        return _newsItems ?  _newsItems : Collections.emptyList()
    }


    //------------------------
    // For sample monitors
    //------------------------
    int getItemCount() {
        return newsItems.size()
    }

    int getLoadedSourcesCount() {
        return newsItems.collect{it.source}.unique().size()
    }

    boolean getAllSourcesLoaded() {
        return loadedSourcesCount == configService.getMap('newsSources').size()
    }

    Date getLastTimestamp() {
        return newsItems ? newsItems[0].published : null
    }


    //------------------------
    // Implementation
    //------------------------
    private void loadAllNews() {
        def sources = configService.getMap('newsSources').keySet().toList()

        withInfo("Loading news from ${sources.size()} configured sources") {
            def items = []
            try {
                items = loadNewsForSources(sources)
            } finally {
                _newsItems = items
            }
        }
    }

    private List<NewsItem> loadNewsForSources(List<String> sources) {
        def sourcesParam = String.join(',', sources)
        def apiKey = configService.getString('newsApiKey'),
            url = "https://newsapi.org/v2/top-headlines?sources=${sourcesParam}&apiKey=${apiKey}",
            response = client.executeAsMap(new HttpGet(url))

        def articles = response.articles,
            ret = []
        articles.eachWithIndex{ it, idx ->
            if (it.publishedAt) {
                def cleanPubString = it.publishedAt.take(19) + 'Z'
                ret << new NewsItem(
                        id: idx,
                        source: it.source.name,
                        title: it.title,
                        author: it.author,
                        text: it.description,
                        url: it.url,
                        imageUrl: it.urlToImage,
                        published: Date.parse("yyyy-MM-dd'T'HH:mm:ssX", cleanPubString)
                )
            }
        }

        log.debug("Loaded ${ret.size()} news items.")

        return ret.sort { -it.published.time }
    }

    private JSONClient getClient() {
        if (!_jsonClient) {
            _jsonClient = new JSONClient()
        }
        return _jsonClient
    }

    void clearCaches() {
        super.clearCaches()
        _jsonClient = null
        _newsItems = []
        loadAllNews()
    }
}
