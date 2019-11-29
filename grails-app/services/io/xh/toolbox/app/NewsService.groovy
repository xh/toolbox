package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.json.JSON
import io.xh.toolbox.NewsItem
import org.grails.web.json.JSONArray

import static io.xh.hoist.util.DateTimeUtils.MINUTES


class NewsService extends BaseService {

    private List<NewsItem> _newsItems
    private Timer newsTimer

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
        return loadedSourcesCount == configService.getJSONObject('newsSources').size()
    }

    Date getLastTimestamp() {
        return newsItems ? newsItems[0].published : null
    }


    //------------------------
    // Implementation
    //------------------------
    private void loadAllNews() {
        def sources = configService.getJSONObject('newsSources').keySet().toList()

        withShortInfo("Loading news from ${sources.size()} configured sources") {
            def items = []

            items.addAll(loadNewsForSources(sources));

            items.sort {-it.published.time}

            _newsItems = items
        }
    }

    private List<NewsItem> loadNewsForSources(List<String> sources) {
        def sourcesParam = String.join(',', sources)
        def apiKey = configService.getString('newsApiKey'),
            url = new URL("https://newsapi.org/v2/top-headlines?sources=${sourcesParam}&apiKey=${apiKey}"),
            response = JSON.parse(url.openStream(), 'UTF-8')

        if (response.status != 'ok') {
            log.error("Unable to fetch news: ${response.message}")
            return Collections.emptyList()
        }

        def articles = response.articles as JSONArray,
            ret = []

        articles.forEach{it ->
            if (it.publishedAt) {
                def cleanPubString = it.publishedAt.take(19) + 'Z'
                ret << new NewsItem(
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

        def grouped = response.articles.groupBy{it.source.id}
        grouped.each{ k, v ->
            log.debug("Loaded ${v.size} news items from ${k}")
        }

        return ret
    }

    void clearCaches() {
        super.clearCaches()
        _newsItems = []
        loadAllNews()
    }
}
