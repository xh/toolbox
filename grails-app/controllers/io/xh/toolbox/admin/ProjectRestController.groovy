package io.xh.toolbox.admin

import io.xh.hoist.admin.AdminRestController
import io.xh.hoist.security.AccessRequiresRole
import io.xh.toolbox.roadmap.Project
import io.xh.toolbox.roadmap.Phase


@AccessRequiresRole('HOIST_ADMIN_READER')
class ProjectRestController extends AdminRestController {

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
