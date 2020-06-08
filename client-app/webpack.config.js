const configureWebpack = require('@xh/hoist-dev-utils/configureWebpack');

module.exports = (env = {}) => {
    return configureWebpack({
        appCode: 'toolbox',
        appName: 'Toolbox',
        appVersion: env.appVersion || '2.0-SNAPSHOT',
        agGridLicenseKey: 'CompanyName=Extremely Heavy Industries,LicensedApplication=Toolbox,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=6,LicensedProductionInstancesCount=1,AssetReference=AG-008400,ExpiryDate=4_June_2021_[v2]_MTYyMjc2MTIwMDAwMA==e5556393a62b122c439b49dfe11f26d9',
        favicon: './public/favicon.png',
        devServerOpenPage: 'app/',
        ...env
    });
};
