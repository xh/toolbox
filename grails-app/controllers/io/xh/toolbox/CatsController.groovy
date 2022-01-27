package io.xh.toolbox


import io.xh.hoist.security.Access

@Access(['APP_READER'])
class CatsController extends BaseController {

    def index() {
        def catsResource = applicationContext.getResource("classpath:cats.jpeg")
        render(file: catsResource.inputStream, contentType: 'image/jpeg')
    }

}
