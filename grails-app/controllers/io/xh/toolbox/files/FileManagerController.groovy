package io.xh.toolbox.files

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['HOIST_ADMIN_READER'])
class FileManagerController extends BaseController {

    def fileManagerService

    @Access(['HOIST_ADMIN'])
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

    @Access(['HOIST_ADMIN'])
    def delete(String filename) {
        def success = fileManagerService.delete(filename)
        renderJSON(success: success)
    }

    @Access(['HOIST_ADMIN'])
    def deleteAll() {
        def ret = fileManagerService.deleteAll()
        renderJSON(ret)
    }

}
