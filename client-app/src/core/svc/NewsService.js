/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {XH, HoistService} from '@xh/hoist/core';

/**
 * Provides a list of news stories with details including headline, text, source, timestamp, and url.
 * This service loads its data from Toolbox's server-side news service, which makes the external API call to newsapi.org.
 */
@HoistService
export class NewsService {

    async initAsync() {
        return await XH.fetchJson({url: 'news'});
    }

}
