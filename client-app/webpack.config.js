const configureWebpack = require('@xh/hoist-dev-utils/configureWebpack');

module.exports = (env = {}) => {
    return configureWebpack({
        appCode: 'toolbox',
        appName: 'Toolbox',
        appVersion: env.appVersion || '2.0-SNAPSHOT',
        favicon: './public/favicon.png',
        devServerOpenPage: 'app/',
        ...env
    });
};
