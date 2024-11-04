package io.xh.toolbox.app


import io.xh.hoist.BaseService
import io.xh.hoist.cachedvalue.CachedValue
import io.xh.hoist.config.ConfigService
import io.xh.hoist.http.JSONClient
import io.xh.toolbox.NewsItem
import org.apache.hc.client5.http.classic.methods.HttpGet

import static io.xh.hoist.util.DateTimeUtils.getMINUTES


class NewsService extends BaseService {

    static clearCachesConfigs = ['newsSources', 'newsApiKey']

    ConfigService configService

    /**
     * Example of a CachedValue being used for caching + expiry via `expireTime` directive.
     * No proactive Timer-based refresh in this service - instead the first caller who comes across
     * an empty or expired cache (on any instance) will trigger a refresh that is replicated to all.
     */
    private CachedValue<List<NewsItem>> _newsItems = createCachedValue(
        name: 'newsItems',
        expireTime: {configService.getInt('newsRefreshMins') * MINUTES},
        replicate: true
    )

    List<NewsItem> getNewsItems() {
        _newsItems.getOrCreate { loadNews() }
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
    private List<NewsItem> loadNews() {
        def sources = configService.getMap('newsSources').keySet().toList(),
            sourcesParam = sources.join(','),
            apiKey = configService.getString('newsApiKey'),
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

        logDebug("Loaded ${ret.size()} news items.")

        return ret
    }

    private JSONClient _jsonClient
    private JSONClient getClient() {
        _jsonClient ?= new JSONClient()
    }

    void clearCaches() {
        _jsonClient = null
        if (isPrimary) {
            _newsItems.clear()
        }
        super.clearCaches()
    }

    Map getAdminStats() {[
        config: configForAdminStats('newsSources', 'newsApiKey')
    ]}
}
