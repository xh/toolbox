## Welcome to the Hoist Toolbox

Toolbox is an application designed to showcase Hoist, Extremely Heavy's full-stack UI toolkit.

Toolbox consists of both a desktop and mobile app with examples of all Hoist Components, their usage, and links to 
related Hoist and Toolbox source code.  Toolbox also provides several application examples which may be especially 
useful as a starting point for application developers new to the framework.

Please refer to the [Hoist Core](https://github.com/xh/hoist-core) and [Hoist React](https://github.com/xh/hoist-react)
repos for detailed information and documentation on Hoist.

Toolbox is (of course) itself a Hoist Application, and XH will aim keep it updated with the latest versions of the Hoist
Framework.  In particular, the dev version -- https://toolbox-dev.xh.io -- will be deployed
with CI using the current `develop` branches of Hoist, while the production version -- https://toolbox.xh.io -- will 
typically be re-released with every new released version of Hoist. 

Toolbox is designed to be highly portable, and optimized for easy checkout and development use.  To this end, no actual
database is required for running the development version of the app:  The development app uses an in-memory H2 database
with all default data provided.  In contrast, The deployed versions of the apps use a standard mySQL database, and can 
be used  to test the full stateful behavior of Hoist applications including usage tracking, preferences, and 
configuration.

Also note that Toolbox uses a simple authentication adapter to provide forms-based authentication.  It is important to 
note that actual Hoist applications will typically use enterprise Single Sign-On (SSO) instead, a usage for which Hoist
is optimized.  The forms-based authentication used here is specific to Toolbox, and the fact that we are publishing it 
on the internet for public usage.  The core of the app can be accessed by logging in as 'toolbox@xh.io' (pwd: 'toolbox');
admin tooling may be accessed with additional credentials which we will be happy to provide as necessary.   

🙏 Thanks for your patience as we continue to build out this application.  All suggestions are welcome!

------------------------------------------
                                                                                  
📫☎️🌎 info@xh.io | <https://xh.io/contact>

Copyright © 2019 Extremely Heavy Industries Inc.
