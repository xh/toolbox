const configureWebpack = require('@xh/hoist-dev-utils/configureWebpack');

module.exports = (env = {}) => {
    return configureWebpack({
        appCode: 'toolbox',
        appName: 'Toolbox',
        appVersion: env.appVersion || '1.0-SNAPSHOT',
        agGridLicenseKey: 'Extremely_Heavy_Industries_Scout_3Devs9_March_2019__MTU1MjA4OTYwMDAwMA==79f1a93b578543bf1e45a51272b2359a',
        favicon: './public/favicon.png',
        devServerOpenPage: 'app/',
        ...env
    });
};
