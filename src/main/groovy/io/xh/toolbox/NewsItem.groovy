package io.xh.toolbox

import io.xh.hoist.json.JSONFormat

class NewsItem implements JSONFormat {

    String source
    String title
    String author
    String text
    String url
    String imageUrl
    Date published

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
