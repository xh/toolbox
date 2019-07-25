package io.xh.toolbox

import grails.boot.GrailsApp
import grails.boot.config.GrailsAutoConfiguration
import io.xh.hoist.websocket.HoistWebSockerHandler
import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.config.annotation.EnableWebSocket
import org.springframework.web.socket.config.annotation.WebSocketConfigurer
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry
import org.springframework.web.socket.handler.PerConnectionWebSocketHandler
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor

@Configuration
@EnableWebSocket
class Application extends GrailsAutoConfiguration implements WebSocketConfigurer {

    static void main(String[] args) {
        GrailsApp.run(Application, args)
    }

    @Override
    void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        def handler = new PerConnectionWebSocketHandler(HoistWebSockerHandler.class)
        registry.addHandler(handler, '/xhWebSocket')
            .addInterceptors(new HttpSessionHandshakeInterceptor())
            .setAllowedOrigins('*')
    }
}