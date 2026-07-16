"use client";

/**
 * 会话管理组件
 *
 * 提供会话列表、设备管理、会话激活/停用 和 会话撤销功能
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { starxAuthClient } from "@/lib/auth-client";
import {
  parseUserAgent,
  formatSessionDuration,
  getSessionStatus,
  isRiskySession,
  getSessionRiskLevel,
  type SessionDevice,
  type SessionListResponse,
} from "@/lib/session-utils";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

interface SessionCardProps {
  session: SessionDevice;
  isCurrent: boolean;
  onRevoke: (sessionId: string) => void;
  onToggleActive: (sessionId: string, currentStatus: "active" | "inactive") => void;
  isRevoking: boolean;
}

type SessionStatus = "active" | "inactive" | "revoked";

function SessionCard({ session, isCurrent, onRevoke, onToggleActive, isRevoking }: SessionCardProps) {
  const device = parseUserAgent(session.userAgent);
  const status = getSessionStatus(session.expiresAt, isCurrent);

  const getStatusLabel = (status: SessionStatus) => {
    switch (status) {
      case "active":
        return isCurrent ? "当前设备" : "活跃";
      case "inactive":
        return "已停用";
      case "revoked":
        return "已撤销";
      default:
        return "未知";
    }
  };

  const getStatusVariant = (status: SessionStatus) => {
    switch (status) {
      case "active":
        return isCurrent
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "revoked":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const risk = getSessionRiskLevel(session, session.extraInfo?.recentSessions);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
          {device.device === "Mobile" ? "📱" : device.device === "Tablet" ? "📲" : "💻"}
        </div>
        <div className="flex flex-col">
          <h3 className="font-medium">{`${device.browser} on ${device.os}`}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            {device.device === "Mobile" && "📱"}
            {device.device === "Tablet" && "📲"}
            {device.device !== "Mobile" && device.device !== "Tablet" && "💻"}
            {device.os}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusVariant(status)}`}>
          {getStatusLabel(status)}
        </span>
        {risk.level !== "none" && (
          <span title={risk.advice} className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
            ⚠️ 风险提示
          </span>
        )}
        <p className="text-xs text-gray-400">
          {formatSessionDuration(session.createdAt)}
        </p>
      </div>
    </div>
  );
}

interface SessionManagerProps {
  className?: string;
}

export function SessionManager({ className }: SessionManagerProps) {
  const [sessions, setSessions] = useState<SessionDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const router = useRouter();

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const authClient = starxAuthClient();
      const result = await authClient.getSession();

      if (result instanceof Error || !result?.data) {
        console.error("获取会话失败:", result instanceof Error ? result.message : 'Unknown error');
        return;
      }

      const sessions = result.data as SessionListResponse;

      if ("error" in result) {
        console.error("获取会话失败:", result.error);
        return;
      }

      // 后处理每个会话，附加额外信息
      const enriched = sessions.sessions.map(s => ({
        ...s,
        extraInfo: {
          recentSessions: sessions.sessions,
        },
      }));

      setSessions(enriched);
    } catch (error) {
      console.error("获取会话时出错:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRevoke = useCallback((sessionId: string) => {
    setSelectedSession(sessionId);
  }, []);

  const handleToggleActive = useCallback((sessionId: string) => {
    setTogglingId(sessionId);
  }, []);

  const confirmRevoke = useCallback(async (sessionId: string) => {
    try {
      const authClient = starxAuthClient();
      const result = (await authClient.revokeSession({ sessionId })) as { success: boolean } | { error: string };

      if ("error" in result) {
        console.error("撤销会话失败:", result.error);
        return;
      }

      await fetchSessions();
      setSelectedSession(null);
      router.refresh();
    } catch (error) {
      console.error("撤销会话时出错:", error);
    }
  }, [router, fetchSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  if (loading) {
    return <div className="flex items-center justify-center py-8">加载中...</div>;
  }

  if (sessions.length === 0) {
    return (
      <Panel className={className}>
        <h3 className="text-lg font-semibold mb-4">设备会话管理</h3>
        <p className="text-gray-500">暂无活跃会话</p>
      </Panel>
    );
  }

  return (
    <Panel className={className}>
      <h3 className="text-lg font-semibold mb-4">设备会话管理</h3>
      <p className="text-sm text-gray-500 mb-4">当前在线：{sessions.length} 个会话</p>

      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            isCurrent={!!session.isCurrent}
            onRevoke={handleRevoke}
            onToggleActive={handleToggleActive}
            isRevoking={selectedSession === session.id}
          />
        ))}
      </div>

      {selectedSession && (
        <div className="mt-4 p-3 border rounded-lg bg-green-50">
          <p className="text-sm">您确定要撤销这个会话吗？</p>
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedSession(null)}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={() => {
                confirmRevoke(selectedSession).catch(() => {});
              }}
            >
              确认撤销
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}
