"use client";

import { useState, useTransition } from "react";
import { AuditLogEntry, AuditEventType, AUDIT_EVENT_LABELS } from "@/lib/audit-log-types";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
import { Loader2, RefreshCw, Filter, Download } from "lucide-react";

type AuditLogDisplay = AuditLogEntry & {
  eventLabel?: string;
};

const EVENT_OPTIONS = Object.entries(AUDIT_EVENT_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function AuditLogClient() {
  const [pending, startTransition] = useTransition();
  const [logs, setLogs] = useState<AuditLogDisplay[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [eventFilter, setEventFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");

  function loadLogs(newOffset = offset) {
    startTransition(async () => {
      try {
        const params = new URLSearchParams();
        if (eventFilter) params.set("event", eventFilter);
        if (actorFilter) params.set("actorId", actorFilter);
        if (targetFilter) params.set("targetUserId", targetFilter);
        params.set("limit", String(limit));
        params.set("offset", String(newOffset));

        const res = await fetch(`/api/admin/audit-logs?${params}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(
            data.logs.map((log: AuditLogEntry) => ({
              ...log,
              eventLabel: AUDIT_EVENT_LABELS[log.event as AuditEventType] || log.event,
            }))
          );
          setTotal(data.total);
          setOffset(newOffset);
        }
      } catch (error) {
        console.error("Failed to load audit logs:", error);
      }
    });
  }

  function initTable() {
    startTransition(async () => {
      const res = await fetch("/api/admin/audit-logs/init", { method: "POST" });
      if (res.ok) {
        loadLogs(0);
      }
    });
  }

  function handleSearch() {
    loadLogs(0);
  }

  function exportCsv() {
    const headers = ["时间", "事件", "操作者", "目标用户", "IP", "详情"];
    const rows = logs.map((log) => [
      log.createdAt ? new Date(log.createdAt).toLocaleString("zh-CN") : "",
      log.eventLabel || log.event,
      log.actorEmail || log.actorId || "-",
      log.targetEmail || log.targetUserId || "-",
      log.ipAddress || "-",
      JSON.stringify(log.metadata || {}),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasMore = offset + logs.length < total;

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <Panel>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} />
          <span className="font-semibold">筛选条件</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">事件类型</label>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="">全部</option>
              {EVENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <TextField
            label="操作者 ID/邮箱"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            placeholder="搜索操作者..."
          />
          <TextField
            label="目标用户 ID/邮箱"
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            placeholder="搜索目标用户..."
          />
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" onClick={handleSearch} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            查询
          </Button>
          <Button variant="secondary" onClick={initTable} disabled={pending}>
            初始化日志表
          </Button>
          <Button variant="ghost" onClick={exportCsv} disabled={logs.length === 0}>
            <Download size={16} />
            导出 CSV
          </Button>
        </div>
      </Panel>

      {/* 日志列表 */}
      <Panel>
        <div className="flex items-center justify-between mb-4">
          <StatusPill label={`共 ${total} 条记录`} tone="muted" />
        </div>

        {logs.length === 0 && !pending ? (
          <div className="text-center py-12 text-zinc-500">
            {total === 0 ? "暂无审计日志" : "点击「查询」加载日志"}
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{log.eventLabel || log.event}</span>
                    </div>
                    <div className="text-sm text-zinc-500">
                      {log.createdAt && (
                        <span>{new Date(log.createdAt).toLocaleString("zh-CN")}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {log.ipAddress && (
                      <div className="text-zinc-400">IP: {log.ipAddress}</div>
                    )}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {log.actorEmail && (
                    <div className="text-zinc-400">
                      操作者: <span className="text-zinc-300">{log.actorEmail}</span>
                    </div>
                  )}
                  {log.targetEmail && (
                    <div className="text-zinc-400">
                      目标: <span className="text-zinc-300">{log.targetEmail}</span>
                    </div>
                  )}
                </div>
                {log.userAgent && (
                  <div className="mt-2 text-xs text-zinc-600 truncate">
                    UA: {log.userAgent}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {logs.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
            <span className="text-sm text-zinc-500">
              显示 {offset + 1}-{offset + logs.length} / {total}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={offset === 0 || pending}
                onClick={() => loadLogs(Math.max(0, offset - limit))}
              >
                上一页
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasMore || pending}
                onClick={() => loadLogs(offset + limit)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
