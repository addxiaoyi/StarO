#!/bin/bash
# ==========================================
# StarX-Oauth 监控脚本
# 用于健康检查和告警
# ==========================================

set -e

# 配置
SERVICE_URL="${HEALTH_CHECK_URL:-http://localhost:3000/api/health}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@example.com}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
LOG_FILE="/var/log/starx-oauth/health-check.log"
MAX_RESPONSE_TIME=5  # 最大响应时间（秒）
MAX_RETRIES=3        # 最大重试次数
RETRY_INTERVAL=10    # 重试间隔（秒）

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

send_alert() {
    local message="$1"
    local severity="${2:-warning}"

    log "${RED}[ALERT]${NC} ${message}"

    # 发送邮件（如果配置了）
    if [ -n "${ALERT_EMAIL}" ]; then
        echo "${message}" | mail -s "[StarX-Oauth ${severity^^}] ${message}" "${ALERT_EMAIL}" 2>/dev/null || true
    fi

    # 发送 Slack（如果配置了）
    if [ -n "${SLACK_WEBHOOK}" ]; then
        curl -s -X POST "${SLACK_WEBHOOK}" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"[StarX-Oauth ${severity^^}] ${message}\"}" 2>/dev/null || true
    fi
}

check_health() {
    local response
    local http_code
    local response_time

    # 记录开始时间
    local start_time=$(date +%s.%N)

    # 发送请求
    response=$(curl -s -w "\n%{http_code}" --max-time ${MAX_RESPONSE_TIME} "${SERVICE_URL}" 2>/dev/null)
    local exit_code=$?

    # 计算响应时间
    local end_time=$(date +%s.%N)
    response_time=$(echo "${end_time} - ${start_time}" | bc 2>/dev/null || echo "0")

    # 检查连接错误
    if [ $exit_code -ne 0 ]; then
        echo "connection_error"
        return 1
    fi

    # 分离响应体和状态码
    http_code=$(echo "${response}" | tail -n1)
    body=$(echo "${response}" | sed '$d')

    # 检查 HTTP 状态码
    if [ "${http_code}" != "200" ] && [ "${http_code}" != "503" ]; then
        echo "http_error:${http_code}"
        return 1
    fi

    # 检查响应体
    if echo "${body}" | grep -q '"status":"ok"'; then
        echo "ok:${response_time}"
        return 0
    elif echo "${body}" | grep -q '"status":"degraded"'; then
        echo "degraded:${response_time}"
        return 2
    else
        echo "unhealthy:${response_time}"
        return 3
    fi
}

# 健康检查主流程
health_check() {
    log "开始健康检查..."

    local result
    local attempt=1

    # 重试机制
    while [ $attempt -le $MAX_RETRIES ]; do
        result=$(check_health)
        local status=$?

        case $result in
            ok:*)
                local time=$(echo "${result}" | cut -d: -f2)
                log "${GREEN}[OK]${NC} 服务正常 (响应时间: ${time}s)"
                return 0
                ;;
            degraded:*)
                local time=$(echo "${result}" | cut -d: -f2)
                log "${YELLOW}[WARNING]${NC} 服务降级 (响应时间: ${time}s)"
                send_alert "StarX-Oauth 服务降级，响应时间较长" "warning"
                return 0
                ;;
            unhealthy:*)
                log "${RED}[FAIL]${NC} 服务不可用 (尝试 ${attempt}/${MAX_RETRIES})"
                ;;
            connection_error)
                log "${RED}[CONN ERROR]${NC} 无法连接到服务 (尝试 ${attempt}/${MAX_RETRIES})"
                ;;
            http_error:*)
                local code=$(echo "${result}" | cut -d: -f2)
                log "${RED}[HTTP ERROR]${NC} HTTP 错误: ${code} (尝试 ${attempt}/${MAX_RETRIES})"
                ;;
        esac

        if [ $attempt -lt $MAX_RETRIES ]; then
            log "等待 ${RETRY_INTERVAL} 秒后重试..."
            sleep $RETRY_INTERVAL
        fi
        attempt=$((attempt + 1))
    done

    # 所有重试都失败
    send_alert "StarX-Oauth 服务不可用，所有重试失败" "critical"
    return 1
}

# 查看 PM2 状态
check_pm2() {
    log "检查 PM2 进程状态..."
    sudo -u www-data pm2 status starx-oauth 2>/dev/null || log "无法获取 PM2 状态"
}

# 查看资源使用
check_resources() {
    log "检查资源使用..."

    # 内存使用
    local memory=$(ps aux | grep "next start" | grep -v grep | awk '{sum+=$6} END {print sum/1024 "MB"}')
    log "Next.js 进程内存使用: ${memory}"

    # CPU 使用
    local cpu=$(ps aux | grep "next start" | grep -v grep | awk '{sum+=$3} END {print sum"%"}')
    log "Next.js 进程 CPU 使用: ${cpu}"

    # 磁盘空间
    local disk=$(df -h "${INSTALL_DIR:-/var/www/starx-oauth}" 2>/dev/null | tail -1 | awk '{print $5}' || echo "N/A")
    log "磁盘使用: ${disk}"

    # 检查资源告警阈值
    local mem_usage=$(echo "${memory}" | sed 's/MB//')
    if (( $(echo "${mem_usage} > 450" | bc -l 2>/dev/null || echo 0) )); then
        send_alert "内存使用过高: ${memory}" "warning"
    fi
}

# 查看错误日志
check_logs() {
    log "最近错误日志:"
    sudo -u www-data pm2 logs starx-oauth --lines 20 --nostream --err 2>/dev/null | tail -20 || \
    journalctl -u starx-oauth -n 20 --no-pager 2>/dev/null || \
    log "无法获取日志"
}

# 数据库连接检查
check_database() {
    log "检查数据库连接..."

    # 如果健康检查端点包含数据库状态
    local response=$(curl -s "${SERVICE_URL}" 2>/dev/null)
    if echo "${response}" | grep -q "database"; then
        local db_status=$(echo "${response}" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ "${db_status}" != "ok" ]; then
            send_alert "数据库连接异常: ${db_status}" "warning"
        fi
    fi
}

# 显示帮助
show_help() {
    cat << 'EOF'
StarX-Oauth 监控脚本

用法: ./monitor.sh [命令]

环境变量:
    HEALTH_CHECK_URL    健康检查端点 URL
    ALERT_EMAIL         告警邮箱
    SLACK_WEBHOOK       Slack Webhook URL

命令:
    health      健康检查
    status      PM2 进程状态
    resources   资源使用情况
    logs        查看错误日志
    database    数据库连接检查
    all         运行所有检查

示例:
    HEALTH_CHECK_URL=http://localhost:3000/api/health ./monitor.sh all
EOF
}

# 主函数
main() {
    COMMAND=${1:-all}

    # 创建日志目录
    mkdir -p "$(dirname "${LOG_FILE}")" 2>/dev/null || true

    case $COMMAND in
        health)
            health_check
            ;;
        status)
            check_pm2
            ;;
        resources)
            check_resources
            ;;
        logs)
            check_logs
            ;;
        database)
            check_database
            ;;
        all)
            health_check
            check_pm2
            check_resources
            check_logs
            check_database
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo "未知命令: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
