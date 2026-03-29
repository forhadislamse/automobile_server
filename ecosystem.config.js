module.exports = {
    apps: [
        {
            name: 'andcates_server',
            script: './dist/server.js',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            }, 
        },
    ],
}; 