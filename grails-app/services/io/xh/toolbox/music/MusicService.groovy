package io.xh.toolbox.music

import io.xh.hoist.BaseService
import io.xh.hoist.json.JSONParser
import io.xh.hoist.jsonblob.JsonBlobService

import java.time.LocalDate

class MusicService extends BaseService {

    JsonBlobService jsonBlobService

    List<Meeting> importFromJsonBlob(String token, Boolean deleteExisting = false) {
        if (deleteExisting) {
            def toDelete = Meeting.list()
            logInfo("Deleting ${toDelete.size()} existing meetings and all their plays")
            toDelete.each{ it.delete()}
        }

        def blob = jsonBlobService.get(token)
        if (!blob) throw new RuntimeException("No blob found with token $token")

        def mtgs = JSONParser.parseArray(blob.value)
        logInfo("Found ${mtgs.size()} to import")

        def ret = new ArrayList<Meeting>()
        ret.ensureCapacity(mtgs.size())

        mtgs.each{rawM ->
            try {
                logInfo("Creating ${rawM.id} with ${rawM.plays.size()} plays")
                def mtg = new Meeting(
                    slug: rawM.id,
                    location: rawM.location,
                    date: LocalDate.parse(rawM.date),
                    year: rawM.year,
                    notes: rawM.notes
                )

                rawM.plays.each{rawP ->
                    mtg.addToPlays(
                        slug: rawP.id,
                        member: rawP.member,
                        title: rawP.title,
                        artist: rawP.artist,
                        album: rawP.album,
                        bonus: rawP.isBonus,
                        notes: rawP.notes
                    )
                }

                mtg.save()
                ret << mtg
            } catch (e) {
                logError("Failed to parse meeting ${rawM.id}", e)
            }
        }

        ret
    }

}
