package io.xh.toolbox.admin

import io.xh.hoist.http.BaseProxyService
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient
import org.apache.hc.client5.http.impl.classic.HttpClients

class TestProxyService extends BaseProxyService {

    CloseableHttpClient createSourceClient() {
       return HttpClients.createDefault()
    }

    protected String getSourceRoot() {
        'https://api.weather.gov'
    }
}
