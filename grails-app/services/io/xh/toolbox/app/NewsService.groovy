package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.json.JSON
import io.xh.hoist.util.Timer
import io.xh.toolbox.NewsItem
import org.grails.web.json.JSONArray
import io.xh.hoist.cache.Cache

import static io.xh.hoist.util.DateTimeUtils.MINUTES
import static io.xh.hoist.util.DateTimeUtils.HOURS


class NewsService extends BaseService {

    def configService

    Cache<String, List<NewsItem>> cache = new Cache(svc: this, expireTime: 2 * HOURS)

    Timer timer

    static clearCachesConfigs = ['newsSources', 'newsApiKey']
    static cacheKey = 'news'

    void init() {
        timer = createTimer(
            runFn: this.&loadAllNews,
            interval: 'newsRefreshMins',
            intervalUnits: MINUTES
        )
        super.init()
    }

    List<NewsItem> getNewsItems() {
        cache.get(cacheKey)
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
        return loadedSourcesCount == sources.size()
    }

    Date getLastTimestamp() {
        if (!newsItems) return null
        return newsItems.get(0).published
    }


    //------------------------
    // Implementation
    //------------------------

    private void loadAllNews() {

        withShortInfo("Loading news from ${sources.size()} configured sources") {
            List<NewsItem> items = []

            sources.each{code, displayName ->
                items.addAll(loadNewsForSource(code, displayName))
            }

            def ret = items ? items.sort{-it.published.time} : Collections.emptyList()
            cache.put(cacheKey, ret)

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

    Map<String, String> getSources() {
        configService.getJSONObject('newsSources')
    }

    void clearCaches() {
        super.clearCaches()
        timer.forceRun()
    }

}
