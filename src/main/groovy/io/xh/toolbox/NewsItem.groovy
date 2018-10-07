package io.xh.toolbox

import io.xh.hoist.json.JSONFormat

class NewsItem implements JSONFormat {

    final String source
    final String title
    final String author
    final String text
    final String url
    final String imageUrl
    final Date published

    NewsItem(Map mp) {
        source = mp.source
        title = mp.title
        author = mp.author
        text = mp.text
        url = mp.url
        imageUrl = mp.imageUrl
        published = mp.published
    }

    boolean cacheJSON() {true}

    Map formatForJSON() {
        return [
                source: source,
                title: title,
                author: author,
                text: text,
                url: url,
                imageUrl: imageUrl,
                published: published
        ]
    }

}
