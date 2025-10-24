package io.xh.toolbox.app

import io.xh.hoist.BaseService

import jakarta.servlet.http.HttpServletRequest
import java.nio.file.Files
import java.nio.file.StandardCopyOption

class FileManagerService extends BaseService {

    def configService

    void saveFromRequest(HttpServletRequest request) {
        request.getParts().each{
            def target = new File("$storagePath/${it.submittedFileName}")
            Files.copy(it.inputStream, target.toPath(), StandardCopyOption.REPLACE_EXISTING)
        }
    }

    List<File> list() {
        return storageDir.listFiles()?.toList() ?: []
    }

    File get(String filename) {
        def ret = new File("$storagePath/$filename")
        if (!ret?.exists()) throw new RuntimeException("File not found with filename \"${filename}\".")
        return ret
    }

    boolean delete(String filename) {
        def fullPath = "${storagePath}/${filename}",
            toDelete = new File(fullPath)

        def deleted = false
        if (toDelete.exists() && toDelete.isFile()) {
            deleted = toDelete.delete()
        }

        return deleted
    }

    Map<String, Integer> deleteAll() {
        def fileCount = 0,
            deletedCount = 0

        list().each {file ->
            fileCount++
            if (file.delete()) deletedCount++
        }

        return [files: fileCount, deleted: deletedCount]
    }


    //------------------------
    // Implementation
    //------------------------
    private File getStorageDir() {
        def dir = new File(storagePath)

        if (!dir.exists()) {
            def created = dir.mkdirs()
            if (!created) throw new RuntimeException("Unable to create storage directory at $storagePath")
        }

        return dir
    }

    private String getStoragePath() {
        return configService.getString('fileManagerStoragePath')
    }

    Map getAdminStats() {[
        config: configForAdminStats('fileManagerStoragePath')
    ]}
}
