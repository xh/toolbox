package io.xh.toolbox.roadmap

class GitLink {

    static belongsTo = [project: Project]
    String name
    static constraints = {
        name(nullable: true, url: true)
    }

    Map formatForJSON(){
        return [
                name: name,
        ]
    }
}
