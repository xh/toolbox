package io.xh.toolbox

import io.xh.hoist.json.JSONFormatCached

class NewsItem extends JSONFormatCached implements Serializable {

    final String id
    final String source
    final String title
    final String author
    final String text
    final String url
    final String imageUrl
    final Date published

    NewsItem(Map mp) {
        id = mp.id
        source = mp.source
        title = mp.title
        author = mp.author
        text = mp.text
        url = mp.url
        imageUrl = mp.imageUrl
        published = mp.published
    }

    Map formatForJSON() {
        return [
                id: id,
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
