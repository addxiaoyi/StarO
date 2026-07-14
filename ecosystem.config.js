/**
 * PM2 生态系统配置文件
 *
 * 使用方法:
 *   1. 上传到服务器 /www/wwwroot/auth.star-web.top/ecosystem.config.js
 *   2. 修改 .env.production 中的配置
 *   3. 运行: pm2 start ecosystem.config.js
 *   4. 保存: pm2 save
 *   5. 设置开机自启: pm2 startup
 */

module.exports = {
  apps: [
    {
      name: "starx-oauth",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3002",

      // 工作目录
      cwd: "/www/wwwroot/auth.star-web.top",

      // 运行环境
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },

      // 性能优化
      instances: 1,                    // 单实例（Next.js 生产模式建议单实例）
      exec_mode: "fork",              // fork 模式（非 cluster）
      node_args: "--max-old-space-size=512",  // 限制内存使用

      // 自动重启
      autorestart: true,
      watch: false,                   // 生产环境关闭 watch
      max_memory_restart: "500M",     // 内存超过 500MB 时重启
      max_restarts: 10,
      min_uptime: "10s",

      // 重启延迟
      restart_delay: 4000,

      // 日志配置
      log_file: "/www/wwwroot/auth.star-web.top/logs/pm2.log",
      out_file: "/www/wwwroot/auth.star-web.top/logs/out.log",
      error_file: "/www/wwwroot/auth.star-web.top/logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",

      // 其他配置
      time: true,

      // 来源标识（便于识别进程）
      source_map_support: true,
    },
  ],
};
