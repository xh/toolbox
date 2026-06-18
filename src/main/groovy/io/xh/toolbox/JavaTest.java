package io.xh.toolbox;

import io.xh.hoist.config.ConfigService;
import io.xh.hoist.pref.PrefService;
import io.xh.hoist.pref.Preference;
import io.xh.hoist.user.IdentityService;
import io.xh.toolbox.app.NewsService;
import io.xh.toolbox.user.UserService;
import io.xh.toolbox.user.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

public class JavaTest {

    private static Logger log = LoggerFactory.getLogger(JavaTest.class);

    public static void helloWorld() {
        List classes = List.of(
                ConfigService.class,
                PrefService.class,
                Preference.class,
                UserService.class,
                User.class,
                IdentityService.class,
                NewsService.class
        );

        log.info("Verified compilation of mixed Java/Groovy sources");
        log.info("Resolved stubs for {} enumerated test Groovy classes from Java", classes.size());
    }
}
