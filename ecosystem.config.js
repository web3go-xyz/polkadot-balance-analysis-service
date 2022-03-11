module.exports = {
    apps: [{
        name: "20017-kusama-balance-analysis-service",
        script: "./dist/main.js",
        max_memory_restart: '1024M',
        node_args: '--max-old-space-size=1024',
        args: ''
    }]
}
