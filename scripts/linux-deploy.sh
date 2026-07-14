#!/bin/bash
# ==========================================
# StarX-Oauth Linux 部署脚本
# 适用于 Ubuntu/Debian/CentOS
# ==========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 项目配置
PROJECT_NAME="starx-oauth"
DEPLOY_USER="www-data"
INSTALL_DIR="/var/www/${PROJECT_NAME}"
LOG_DIR="/var/log/${PROJECT_NAME}"
BACKUP_DIR="/var/backups/${PROJECT_NAME}"
PORT=3000

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 root 用户运行此脚本，或使用 sudo"
        exit 1
    fi
}

# 检查系统环境
check_system() {
    log_info "检查系统环境..."

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi

    NODE_VERSION=$(node -v)
    log_info "Node.js 版本: ${NODE_VERSION}"

    # 检查 PM2
    if ! command -v pm2 &> /dev/null; then
        log_warn "PM2 未安装，正在安装..."
        npm install -g pm2
    fi

    # 检查 PostgreSQL
    if ! command -v psql &> /dev/null; then
        log_warn "PostgreSQL 未安装，建议安装: apt install postgresql postgresql-contrib"
    fi

    # 检查 Nginx
    if ! command -v nginx &> /dev/null; then
        log_warn "Nginx 未安装，建议安装: apt install nginx"
    fi
}

# 创建目录结构
create_directories() {
    log_info "创建目录结构..."

    mkdir -p "${INSTALL_DIR}"
    mkdir -p "${LOG_DIR}"
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "${INSTALL_DIR}/logs"
    mkdir -p "${INSTALL_DIR}/.data"

    # 设置权限
    chown -R ${DEPLOY_USER}:${DEPLOY_USER} "${INSTALL_DIR}"
    chown -R ${DEPLOY_USER}:${DEPLOY_USER} "${LOG_DIR}"
}

# 配置环境变量
setup_env() {
    log_info "配置环境变量..."

    ENV_FILE="${INSTALL_DIR}/.env.production"

    if [ ! -f "${ENV_FILE}" ]; then
        cat > "${ENV_FILE}" << 'EOF'
# 生产环境配置
NODE_ENV=production
PORT=3000

# === 必填配置 ===
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://your-domain.com
DATABASE_URL=postgresql://user:password@localhost:5432/starx_oauth

# === 邮件配置 ===
EMAIL_FROM=StarX-Oauth <noreply@your-domain.com>
RESEND_API_KEY=
# 或 SMTP 配置
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=

# === OAuth 登录 ===
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# === 管理员（首次部署后删除） ===
STARX_FIRST_ADMIN_EMAIL=
STARX_FIRST_ADMIN_NAME=
STARX_FIRST_ADMIN_PASSWORD=

# === OpenTelemetry（可选） ===
OTEL_ENABLED=false
OTEL_SERVICE_NAME=starx-oauth
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# === 安全配置 ===
SECURE_COOKIE=true
EOF
        chmod 600 "${ENV_FILE}"
        chown ${DEPLOY_USER}:${DEPLOY_USER} "${ENV_FILE}"
        log_warn "请编辑 ${ENV_FILE} 填写必要的配置"
    fi
}

# 部署应用
deploy_app() {
    log_info "部署应用..."

    # 创建临时目录
    TEMP_DIR=$(mktemp -d)
    cd "${TEMP_DIR}"

    # 复制项目文件（排除敏感文件）
    rsync -av --exclude='node_modules' \
           --exclude='.next' \
           --exclude='.git' \
           --exclude='.env.local' \
           --exclude='*.log' \
           --exclude='.local' \
           /path/to/source/ "${INSTALL_DIR}/"

    # 安装依赖
    cd "${INSTALL_DIR}"
    npm ci --production

    # 构建应用
    npm run build

    # 清理
    rm -rf "${TEMP_DIR}"

    log_info "应用部署完成"
}

# 配置 PM2
setup_pm2() {
    log_info "配置 PM2..."

    # 创建 PM2 配置文件
    cat > "${INSTALL_DIR}/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: "starx-oauth",
      script: "node_modules/next/dist/bin/next",
      args: "start -p " + process.env.PORT || 3000,
      cwd: process.cwd(),
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      node_args: "--max-old-space-size=512",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      log_file: "./logs/pm2.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      time: true,
      source_map_support: true,
    },
  ],
};
EOF

    # 启动应用
    cd "${INSTALL_DIR}"
    sudo -u ${DEPLOY_USER} pm2 delete ${PROJECT_NAME} 2>/dev/null || true
    sudo -u ${DEPLOY_USER} pm2 start ecosystem.config.js
    sudo -u ${DEPLOY_USER} pm2 save

    # 设置开机自启
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ${DEPLOY_USER} --hpwd /opt 2>/dev/null || \
    sudo env PATH=$PATH:/usr/bin pm2 startup 2>/dev/null || true
}

# 配置 Nginx 反向代理
setup_nginx() {
    log_info "配置 Nginx..."

    cat > "/etc/nginx/sites-available/${PROJECT_NAME}" << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 配置（使用 Let's Encrypt 建议）
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 日志
    access_log /var/log/nginx/starx-oauth-access.log;
    error_log /var/log/nginx/starx-oauth-error.log;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 上游服务器
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # 健康检查（不经过代理）
    location /api/health {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # 静态文件（Next.js）
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF

    # 启用站点
    ln -sf /etc/nginx/sites-available/${PROJECT_NAME} /etc/nginx/sites-enabled/

    # 测试配置
    nginx -t

    # 重载 Nginx
    systemctl reload nginx

    log_info "Nginx 配置完成"
}

# 配置防火墙
setup_firewall() {
    log_info "配置防火墙..."

    # UFW
    if command -v ufw &> /dev/null; then
        ufw --force enable
        ufw allow ssh
        ufw allow http
        ufw allow https
        ufw reload
        log_info "UFW 防火墙已配置"
    fi

    # firewalld
    if command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
        log_info "firewalld 防火墙已配置"
    fi
}

# 数据库迁移
run_migrations() {
    log_info "运行数据库迁移..."

    cd "${INSTALL_DIR}"
    sudo -u ${DEPLOY_USER} npm run db:migration
    sudo -u ${DEPLOY_USER} npm run db:migration:apply

    log_info "数据库迁移完成"
}

# 创建管理员
create_admin() {
    log_info "创建管理员账号..."

    cd "${INSTALL_DIR}"
    sudo -u ${DEPLOY_USER} npm run db:seed-admin

    log_warn "请在创建管理员后删除 .env 中的 STARX_FIRST_ADMIN_* 配置"
}

# 备份函数
backup() {
    log_info "创建备份..."

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/${PROJECT_NAME}_${TIMESTAMP}.tar.gz"

    tar -czf "${BACKUP_FILE}" \
        -C "${INSTALL_DIR}" \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='logs' \
        .

    log_info "备份已保存到: ${BACKUP_FILE}"
}

# 查看状态
show_status() {
    log_info "服务状态..."

    sudo -u ${DEPLOY_USER} pm2 status
    sudo -u ${DEPLOY_USER} pm2 logs --lines 20 --nostream
}

# 显示帮助
show_help() {
    cat << 'EOF'
StarX-Oauth 部署脚本

用法: ./deploy.sh [命令]

命令:
    install     安装并配置所有依赖
    deploy      部署应用（不包含数据库设置）
    migrate     运行数据库迁移
    admin       创建管理员账号
    backup      创建备份
    restore     恢复备份（需要指定备份文件）
    status      查看服务状态
    logs        查看日志
    restart     重启服务
    stop        停止服务
    uninstall   卸载应用（谨慎使用）

示例:
    ./deploy.sh install      # 首次安装
    ./deploy.sh deploy      # 部署应用
    ./deploy.sh migrate     # 运行迁移
    ./deploy.sh admin       # 创建管理员
    ./deploy.sh status      # 查看状态
EOF
}

# 主函数
main() {
    COMMAND=${1:-help}

    case $COMMAND in
        install)
            check_root
            check_system
            create_directories
            setup_env
            deploy_app
            setup_pm2
            setup_nginx
            setup_firewall
            log_info "安装完成！请编辑 ${INSTALL_DIR}/.env.production 填写配置"
            ;;
        deploy)
            check_root
            deploy_app
            setup_pm2
            log_info "部署完成"
            ;;
        migrate)
            run_migrations
            ;;
        admin)
            create_admin
            ;;
        backup)
            backup
            ;;
        status)
            show_status
            ;;
        logs)
            sudo -u ${DEPLOY_USER} pm2 logs ${PROJECT_NAME} --lines 50 --nostream
            ;;
        restart)
            sudo -u ${DEPLOY_USER} pm2 restart ${PROJECT_NAME}
            log_info "服务已重启"
            ;;
        stop)
            sudo -u ${DEPLOY_USER} pm2 stop ${PROJECT_NAME}
            log_info "服务已停止"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
