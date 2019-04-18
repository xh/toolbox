const configureWebpack = require('@xh/hoist-dev-utils/configureWebpack');

module.exports = (env = {}) => {
    return configureWebpack({
        appCode: 'toolbox',
        appName: 'Toolbox',
        appVersion: env.appVersion || '2.0-SNAPSHOT',
        agGridLicenseKey: 'Extreme_Heavy_Industries__Scout_3Devs3_April_2020__MTU4NTg2ODQwMDAwMA==8f836aa25989abb0db36231c347dd436',
        favicon: './public/favicon.png',
        devServerOpenPage: 'app/',
        ...env
    });
};
