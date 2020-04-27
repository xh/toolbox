/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2020 Extremely Heavy Industries Inc.
 */

package io.xh.toolbox.admin

import io.xh.hoist.RestController
import io.xh.hoist.security.Access
import io.xh.toolbox.roadmap.Project
import io.xh.toolbox.roadmap.Phase

@Access(['HOIST_ADMIN'])
class ProjectRestController extends RestController {

    static restTarget = Project
    static trackChanges = true

    def lookupData() {
        renderJSON (
                statuses: Project.STATUSES,
                categories: Project.CATEGORIES,
                phases: Phase.list().collect{it.name}.unique(),
                releaseVersions: Project.list().collect{it.releaseVersion}.unique()
        )
    }

    protected void preprocessSubmit(Map submit) {
        submit.lastUpdatedBy = username
        if (submit.phaseName) {
            def phase = Phase.findByName(submit.phaseName)
            submit.phase = phase
        }
    }
}
