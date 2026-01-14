package io.xh.toolbox.files

import io.xh.hoist.security.AccessRequiresRole
import io.xh.toolbox.BaseController


@AccessRequiresRole('HOIST_ADMIN_READER')
class FileManagerController extends BaseController {

    def fileManagerService

    @AccessRequiresRole('HOIST_ADMIN')
    def upload() {
        fileManagerService.saveFromRequest(request)
        renderJSON(success: true)
    }

    def list() {
        def ret = fileManagerService.list().collect{
            [
                name: it.name,
                path: it.path,
                size: it.size()
            ]
        }
        renderJSON(ret)
    }

    def download(String filename) {
        def file = fileManagerService.get(filename)
        render(
            file: file,
            fileName: filename,
            contentType: 'application/octet-stream'
        )
    }

    @AccessRequiresRole('HOIST_ADMIN')
    def delete(String filename) {
        def success = fileManagerService.delete(filename)
        renderJSON(success: success)
    }

    @AccessRequiresRole('HOIST_ADMIN')
    def deleteAll() {
        def ret = fileManagerService.deleteAll()
        renderJSON(ret)
    }

}
