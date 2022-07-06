
const { defineConfig } = require('cypress');

module.exports = defineConfig({
    // TODO: Find an auth flow that does not require visiting an external site
    chromeWebSecurity: false,
    video: false,
    e2e: {
        baseUrl: 'http://localhost:3000/app'
    }
});
