/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2026 Extremely Heavy Industries Inc.
 */
package io.xh.toolbox.observe

import io.xh.hoist.BaseController
import io.xh.hoist.security.AccessAll

/**
 * Exposes support for observable metrics provided by this application.
 */
@AccessAll
class PrometheusController extends BaseController {

    def metricsService

    /**
     * Access to metrics in form for Prometheus server.
     * Use this instead of the build-in  '/actuator/prometheus'.
     */
    def index() {
        render(
            contentType: 'text/plain; version=0.0.4; charset=utf-8',
            text: metricsService.prometheusData()
        )
    }

}
