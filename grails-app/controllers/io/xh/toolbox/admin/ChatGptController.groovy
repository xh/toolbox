package io.xh.toolbox.admin


import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access('CHAT_GPT_USER')
class ChatGptController extends BaseController {

    def configService

    def config() {
        // TODO - would like to get initialSystemMessage from config, but config editor doesn't persist newlines
        //      which then breaks markdown formatting/detection. Prob. not important to GPT but doesn't look as
        //      good in the UI. Currently copied into ChatGptService.ts.
//        renderJSON([
//                *:configService.getMap('chatGptConfig'),
//                initialSystemMessage: configService.getString('chatGptInitialSystemMessage')
//        ])
        renderJSON(configService.getMap('chatGptConfig'))
    }

}
