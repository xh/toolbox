package io.xh.toolbox.files

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['HOIST_ADMIN'])
class FileManagerController extends BaseController {

    def fileManagerService

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

    def delete(String filename) {
        def success = fileManagerService.delete(filename)
        renderJSON(success: success)
    }

    def deleteAll() {
        def ret = fileManagerService.deleteAll()
        renderJSON(ret)
    }

}
