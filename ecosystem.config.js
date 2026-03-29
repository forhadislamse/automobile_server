module.exports = {
    apps: [
        {
            name: 'regwheat_server',
            script: './dist/server.js',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            }, 
        },
    ],
}; 