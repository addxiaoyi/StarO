"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { CalendarClock, Check, Copy, Fingerprint, KeyRound, Loader2, LogOut, Power, RefreshCw, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { TextField } from "@/components/ui/text-field";
import { starxAuthClient, type ApiKeyRecord } from "@/lib/auth-client";
import { toFriendlyAuthMessage } from "@/lib/friendly-auth-copy";

type DashboardClientProps = {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    emailVerified?: boolean | null;
    twoFactorEnabled?: boolean | null;
  };
};

type TwoFactorSetup = {
  totpURI: string;
  backupCodes: string[];
};

type DashboardAction =
  | "sign-out"
  | "passkey"
  | "enable-2fa"
  | "verify-2fa"
  | "api-key"
  | "api-key-list"
  | `api-key-delete:${string}`
  | `api-key-toggle:${string}`
  | `api-key-extend:${string}`
  | "sessions"
  | "";

export function DashboardClient({ user }: DashboardClientProps) {
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<DashboardAction>("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [connectionKeys, setConnectionKeys] = useState<ApiKeyRecord[]>([]);
  const [connectionKeyTotal, setConnectionKeyTotal] = useState(0);
  const [connectionKeysLoading, setConnectionKeysLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user.twoFactorEnabled));
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);
  const displayName = user.name || user.email || "当前用户";
  const accountDetail = user.email ? `登录邮箱：${user.email}` : "已登录，可管理你的账号安全设置。";
  const dashboardBusy = pending || Boolean(pendingAction);
  const actionPending = (action: DashboardAction) => pendingAction === action;

  const showMessage = useCallback((value: string, key = "") => {
    setError("");
    setMessage(value);
    setApiKey(key);
    setCopied(false);
  }, []);

  const showError = useCallback((value: string) => {
    setMessage("");
    setApiKey("");
    setError(value);
    setCopied(false);
    setBackupCodesCopied(false);
  }, []);

  const loadConnectionKeys = useCallback(async (quiet = false) => {
    if (!quiet) {
      setPendingAction("api-key-list");
      setConnectionKeysLoading(true);
    }

    try {
      const client = starxAuthClient();
      const result = await client.apiKey.list({
        query: {
          limit: 50,
          offset: 0,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });

      if (result?.error) {
        showError(toFriendlyAuthMessage(result.error.message, "连接码列表暂时无法加载，请稍后再试。"));
        return;
      }

      setConnectionKeys(result?.data?.apiKeys || []);
      setConnectionKeyTotal(result?.data?.total ?? result?.data?.apiKeys?.length ?? 0);
    } catch {
      showError("连接码列表暂时无法加载，请稍后再试。");
    } finally {
      setConnectionKeysLoading(false);
      if (!quiet) {
        setPendingAction("");
      }
    }
  }, [showError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadConnectionKeys();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadConnectionKeys]);

  function report(ok: string, bad = "操作没有成功，请稍后再试。") {
    return {
      onSuccess() {
        showMessage(ok);
      },
      onError(context: { error?: { message?: string } }) {
        showError(toFriendlyAuthMessage(context.error?.message, bad));
      },
    };
  }

  function addPasskey(formData: FormData) {
    setPendingAction("passkey");
    startTransition(async () => {
      try {
        const name = String(formData.get("name") || "我的常用设备");
        const client = starxAuthClient();
        const result = await client.passkey.addPasskey({ name });
        if (result?.error) {
          showError(toFriendlyAuthMessage(result.error.message, "添加当前设备失败，请再试一次。"));
          return;
        }
        showMessage("当前设备已添加。下次可以用它更快登录。");
      } finally {
        setPendingAction("");
      }
    });
  }

  function enableTwoFactor(formData: FormData) {
    setPendingAction("enable-2fa");
    startTransition(async () => {
      try {
        const password = String(formData.get("password") || "");
        const client = starxAuthClient();
        const result = await client.twoFactor.enable({ password });
        if (result?.error) {
          showError(toFriendlyAuthMessage(result.error.message, "开启登录确认失败，请稍后再试。"));
          return;
        }

        const totpURI = result?.data?.totpURI;
        if (!totpURI) {
          showError("登录确认设置还没准备好，请稍后再试。");
          return;
        }

        setTwoFactorSetup({
          totpURI,
          backupCodes: result?.data?.backupCodes || [],
        });
        setBackupCodesCopied(false);
        showMessage("请用验证器应用扫码保存，再输入 6 位数字完成开启。");
      } finally {
        setPendingAction("");
      }
    });
  }

  function verifyTwoFactorSetup(formData: FormData) {
    setPendingAction("verify-2fa");
    startTransition(async () => {
      try {
        const code = String(formData.get("code") || "");
        const client = starxAuthClient();
        const result = await client.twoFactor.verifyTotp({ code });

        if (result?.error) {
          showError(toFriendlyAuthMessage(result.error.message, "6 位数字不正确，请重新输入。"));
          return;
        }

        setTwoFactorEnabled(true);
        setTwoFactorSetup(null);
        showMessage("登录确认已开启。下次登录会多一步确认。");
      } finally {
        setPendingAction("");
      }
    });
  }

  function createApiKey(formData: FormData) {
    setPendingAction("api-key");
    startTransition(async () => {
      try {
        const name = String(formData.get("name") || "StarX 集成");
        const expiresIn = apiKeyExpiresIn(formData.get("expiresIn"));
        const client = starxAuthClient();
        const result = await client.apiKey.create({
          name,
          expiresIn,
        });
        if (result?.error) {
          showError(toFriendlyAuthMessage(result.error.message, "创建连接码失败，请稍后再试。"));
          return;
        }
        await loadConnectionKeys(true);
        showMessage(result?.data?.key ? "连接码已创建，只会显示这一次，请现在复制保存。" : "连接码已创建。", result?.data?.key || "");
      } finally {
        setPendingAction("");
      }
    });
  }

  function deleteConnectionKey(key: ApiKeyRecord) {
    if (!window.confirm(`确认撤销“${key.name || "这个连接码"}”吗？撤销后使用它的工具会停止连接。`)) {
      return;
    }

    setPendingAction(`api-key-delete:${key.id}`);
    startTransition(async () => {
      try {
        const client = starxAuthClient();
        const result = await client.apiKey.delete({ keyId: key.id });

        if (result?.error) {
          showError(toFriendlyAuthMessage(result.error.message, "连接码没有撤销成功，请稍后再试。"));
          return;
        }

        await loadConnectionKeys(true);
        showMessage("连接码已撤销。");
      } finally {
        setPendingAction("");
      }
    });
  }

  function toggleConnectionKey(key: ApiKeyRecord) {
    setPendingAction(`api-key-toggle:${key.id}`);
    startTransition(async () => {
      try {
        const client = starxAuthClient();
        const nextEnabled = !key.enabled;
        const result = await client.apiKey.update({
          keyId: key.id,
          enabled: nextEnabled,
        });

        if (result?.error) {
          showError(toFriendlyAuthMessage(result.error.message, "连接码状态没有更新成功，请稍后再试。"));
          return;
        }

        await loadConnectionKeys(true);
        showMessage(nextEnabled ? "连接码已重新启用。" : "连接码已暂停使用。");
      } finally {
        setPendingAction("");
      }
    });
  }

  function extendConnectionKey(key: ApiKeyRecord) {
    setPendingAction(`api-key-extend:${key.id}`);
    startTransition(async () => {
      try {
        const client = starxAuthClient();
        const result = await client.apiKey.update({
          keyId: key.id,
          expiresIn: 60 * 60 * 24 * 90,
        });

        if (result?.error) {
          showError(toFriendlyAuthMessage(result.error.message, "连接码有效期没有更新成功，请稍后再试。"));
          return;
        }

        await loadConnectionKeys(true);
        showMessage("连接码有效期已延长 90 天。");
      } finally {
        setPendingAction("");
      }
    });
  }

  function revokeOtherSessions() {
    setPendingAction("sessions");
    startTransition(async () => {
      try {
        const client = starxAuthClient();
        const result = await client.revokeOtherSessions({}, { ...report("其他设备已退出账号。", "现在不能让其他设备退出，请稍后再试。") });
        if (result?.error) {
          showError(toFriendlyAuthMessage(result.error.message, "现在不能让其他设备退出，请稍后再试。"));
        }
      } finally {
        setPendingAction("");
      }
    });
  }

  async function copyConnectionKey() {
    if (!apiKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
    } catch {
      setError("");
      setMessage("复制失败，请手动选中连接码后复制。");
      setCopied(false);
    }
  }

  async function copyBackupCodes() {
    if (!twoFactorSetup?.backupCodes.length) {
      return;
    }

    try {
      await navigator.clipboard.writeText(twoFactorSetup.backupCodes.join("\n"));
      setBackupCodesCopied(true);
    } catch {
      setError("");
      setMessage("复制失败，请手动选中备用码后复制。");
      setBackupCodesCopied(false);
    }
  }

  function signOut() {
    setPendingAction("sign-out");
    startTransition(async () => {
      try {
        const client = starxAuthClient();
        await client.signOut({
          fetchOptions: {
            onSuccess() {
              window.location.href = "/sign-in";
            },
          },
        });
      } finally {
        setPendingAction("");
      }
    });
  }

  return (
    <div className="grid gap-5">
      <section className="surface grid gap-4 rounded-[1.65rem] p-5 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-sm text-zinc-500">当前账号</p>
          <h1 className="mt-1 text-3xl font-semibold text-white">{displayName}</h1>
          <p className="mt-2 text-sm text-zinc-500">{accountDetail}</p>
        </div>
        <Button type="button" variant="secondary" onClick={signOut} disabled={dashboardBusy} aria-busy={actionPending("sign-out")}>
          {actionPending("sign-out") ? <Loader2 className="animate-spin" size={17} /> : <LogOut size={17} />}
          {actionPending("sign-out") ? "正在退出..." : "退出登录"}
        </Button>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <ActionCard icon={<Fingerprint size={20} />} title="用设备登录" description="把这台电脑或手机加入账号，下次可以用系统验证快速登录。">
          <form onSubmit={(event) => submitForm(event, addPasskey)} className="grid gap-3">
            <TextField label="设备名称" name="name" placeholder="例如：工作电脑" />
            <Button type="submit" variant="secondary" disabled={dashboardBusy} aria-busy={actionPending("passkey")}>
              {actionPending("passkey") ? <Loader2 className="animate-spin" size={17} /> : <Fingerprint size={17} />}
              {actionPending("passkey") ? "正在添加..." : "添加这台设备"}
            </Button>
          </form>
        </ActionCard>

        <ActionCard icon={<ShieldCheck size={20} />} title="登录多一步确认" description="登录时多确认一次，账号更不容易被别人使用。">
          {twoFactorEnabled ? (
            <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-100">
              已开启。下次登录会多一步确认。
            </div>
          ) : (
            <div className="grid gap-4">
              <form onSubmit={(event) => submitForm(event, enableTwoFactor)} className="grid gap-3">
                <TextField label="当前登录密码" name="password" type="password" placeholder="输入当前密码后继续" />
                <Button type="submit" variant="secondary" disabled={dashboardBusy} aria-busy={actionPending("enable-2fa")}>
                  {actionPending("enable-2fa") ? <Loader2 className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
                  {actionPending("enable-2fa") ? "正在准备..." : "开始设置"}
                </Button>
              </form>

              {twoFactorSetup ? (
                <div className="grid gap-4 border-t border-white/10 pt-4">
                  <div className="grid gap-3">
                    <p className="text-sm font-semibold text-white">扫码保存到验证器应用</p>
                    <div className="flex justify-center rounded-2xl bg-white p-4">
                      <QRCode value={twoFactorSetup.totpURI} size={168} title="验证器应用二维码" />
                    </div>
                    <p className="text-xs leading-5 text-zinc-500">用常用验证器应用扫描二维码，保存后输入 6 位数字。</p>
                  </div>

                  {twoFactorSetup.backupCodes.length ? (
                    <div className="grid gap-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-white">备用登录码</p>
                        <Button type="button" variant="ghost" className="shrink-0" onClick={copyBackupCodes}>
                          {backupCodesCopied ? <Check size={16} /> : <Copy size={16} />}
                          {backupCodesCopied ? "已复制" : "复制备用码"}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/25 p-3 font-mono text-xs text-white">
                        {twoFactorSetup.backupCodes.map((code) => (
                          <span key={code} className="break-all rounded-xl bg-white/[0.045] px-2 py-2">
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <form onSubmit={(event) => submitForm(event, verifyTwoFactorSetup)} className="grid gap-3">
                    <TextField label="验证器应用里的 6 位数字" name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" required />
                    <Button type="submit" variant="secondary" disabled={dashboardBusy} aria-busy={actionPending("verify-2fa")}>
                      {actionPending("verify-2fa") ? <Loader2 className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
                      {actionPending("verify-2fa") ? "正在开启..." : "完成开启"}
                    </Button>
                  </form>
                </div>
              ) : null}
            </div>
          )}
        </ActionCard>

        <ActionCard icon={<KeyRound size={20} />} title="连接自己的工具" description="给自己的工具或工作流连接账号时使用，只在创建后显示一次。">
          <form onSubmit={(event) => submitForm(event, createApiKey)} className="grid gap-3">
            <TextField label="用途名称" name="name" placeholder="例如：数据同步" />
            <label className="grid gap-2 text-sm text-zinc-200">
              <span className="font-medium">有效期</span>
              <select
                name="expiresIn"
                className="focus-ring h-12 rounded-2xl border border-white/12 bg-black/35 px-4 text-base text-white transition focus:border-sky-300/70"
                defaultValue="7776000"
              >
                <option value="2592000">30 天</option>
                <option value="7776000">90 天</option>
                <option value="31536000">一年</option>
                <option value="never">长期有效</option>
              </select>
            </label>
            <Button type="submit" variant="secondary" disabled={dashboardBusy} aria-busy={actionPending("api-key")}>
              {actionPending("api-key") ? <Loader2 className="animate-spin" size={17} /> : <KeyRound size={17} />}
              {actionPending("api-key") ? "正在创建..." : "创建连接码"}
            </Button>
          </form>
        </ActionCard>
      </div>

      <section className="surface rounded-[1.65rem] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex rounded-2xl bg-white/8 p-3 text-white">
              <KeyRound size={20} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">已有连接码</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">查看用途、有效期和最后使用时间；不再使用时可以撤销。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={connectionKeysLoading ? "加载中" : `${connectionKeyTotal} 个连接码`} tone={connectionKeysLoading ? "warn" : "muted"} />
            <Button type="button" variant="ghost" disabled={dashboardBusy} onClick={() => void loadConnectionKeys()}>
              {actionPending("api-key-list") ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              {actionPending("api-key-list") ? "正在刷新..." : "刷新列表"}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3" aria-busy={connectionKeysLoading}>
          {!connectionKeysLoading && connectionKeys.length === 0 ? (
            <div className="rounded-2xl border border-white/12 bg-black/25 px-4 py-5 text-sm text-zinc-400" role="status">
              <div className="font-semibold text-zinc-200">还没有连接码</div>
              <div className="mt-1 leading-6">创建后可以在这里查看有效期、最后使用时间和状态。</div>
            </div>
          ) : null}

          {connectionKeys.map((key) => (
            <ConnectionKeyRow
              key={key.id}
              connectionKey={key}
              busy={dashboardBusy}
              pendingAction={pendingAction}
              onToggle={toggleConnectionKey}
              onExtend={extendConnectionKey}
              onDelete={deleteConnectionKey}
            />
          ))}
        </div>
      </section>

      <section className="surface rounded-[1.65rem] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex rounded-2xl bg-white/8 p-3 text-white">
              <Smartphone size={20} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">其他已登录设备</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">需要时，可以让其他设备退出账号，当前设备会保留。</p>
          </div>
          <Button type="button" variant="secondary" onClick={revokeOtherSessions} disabled={dashboardBusy} aria-busy={actionPending("sessions")}>
            {actionPending("sessions") ? <Loader2 className="animate-spin" size={17} /> : <Smartphone size={17} />}
            {actionPending("sessions") ? "正在处理..." : "让其他设备退出"}
          </Button>
        </div>
      </section>

      {message || error ? (
        <div
          aria-live="polite"
          role={error ? "alert" : "status"}
          className={`rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-400/30 bg-red-500/10 text-red-100" : "border-sky-300/30 bg-sky-400/10 text-sky-100"}`}
        >
          <p>{error || message}</p>
          {apiKey ? (
            <div className="mt-3 grid gap-3">
              <p className="break-all rounded-xl border border-white/10 bg-black/25 p-3 font-mono text-xs leading-6 text-white">
                {apiKey}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-sky-100/75">保存到安全的地方。离开页面后，我们不会再次显示完整内容。</p>
                <Button type="button" variant="secondary" className="shrink-0" onClick={copyConnectionKey}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "已复制" : "复制连接码"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface rounded-[1.65rem] p-5">
      <div className="inline-flex rounded-2xl bg-white/8 p-3 text-white">{icon}</div>
      <h2 className="mt-4 text-xl font-semibold text-white">{title}</h2>
      <p className="mt-1 min-h-[3rem] text-sm leading-6 text-zinc-500">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ConnectionKeyRow({
  connectionKey,
  busy,
  pendingAction,
  onToggle,
  onExtend,
  onDelete,
}: {
  connectionKey: ApiKeyRecord;
  busy: boolean;
  pendingAction: DashboardAction;
  onToggle: (key: ApiKeyRecord) => void;
  onExtend: (key: ApiKeyRecord) => void;
  onDelete: (key: ApiKeyRecord) => void;
}) {
  const enabled = connectionKey.enabled !== false;
  const expired = isPastDate(connectionKey.expiresAt);
  const statusTone = !enabled || expired ? "warn" : "ok";
  const statusLabel = expired ? "已过期" : enabled ? "可使用" : "已暂停";

  return (
    <article className="rounded-2xl border border-white/12 bg-black/25 p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-white">{connectionKey.name || "未命名连接码"}</h3>
            <StatusPill label={statusLabel} tone={statusTone} />
          </div>
          <div className="mt-2 grid gap-2 text-sm text-zinc-500 sm:grid-cols-2">
            <p className="flex min-w-0 items-center gap-2">
              <KeyRound size={15} />
              <span className="truncate">开头：{connectionKey.start || connectionKey.prefix || "创建后隐藏"}</span>
            </p>
            <p className="flex min-w-0 items-center gap-2">
              <CalendarClock size={15} />
              <span className="truncate">到期：{formatDateTime(connectionKey.expiresAt) || "长期有效"}</span>
            </p>
            <p className="flex min-w-0 items-center gap-2">
              <RefreshCw size={15} />
              <span className="truncate">最后使用：{formatDateTime(connectionKey.lastRequest) || "还没有使用记录"}</span>
            </p>
            <p className="flex min-w-0 items-center gap-2">
              <Power size={15} />
              <span className="truncate">请求次数：{connectionKey.requestCount ?? 0}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onToggle(connectionKey)}>
            {pendingAction === `api-key-toggle:${connectionKey.id}` ? <Loader2 className="animate-spin" size={16} /> : <Power size={16} />}
            {pendingAction === `api-key-toggle:${connectionKey.id}` ? "正在更新..." : enabled ? "暂停使用" : "重新启用"}
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onExtend(connectionKey)}>
            {pendingAction === `api-key-extend:${connectionKey.id}` ? <Loader2 className="animate-spin" size={16} /> : <CalendarClock size={16} />}
            {pendingAction === `api-key-extend:${connectionKey.id}` ? "正在延长..." : "延长 90 天"}
          </Button>
          <Button type="button" variant="danger" disabled={busy} onClick={() => onDelete(connectionKey)}>
            {pendingAction === `api-key-delete:${connectionKey.id}` ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            {pendingAction === `api-key-delete:${connectionKey.id}` ? "正在撤销..." : "撤销连接码"}
          </Button>
        </div>
      </div>
    </article>
  );
}

function apiKeyExpiresIn(value: FormDataEntryValue | null) {
  const rawValue = String(value || "");

  if (rawValue === "never") {
    return null;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60 * 60 * 24 * 90;
}

function parseDate(value?: Date | string | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPastDate(value?: Date | string | null) {
  const date = parseDate(value);
  return Boolean(date && date.getTime() < Date.now());
}

function formatDateTime(value?: Date | string | null) {
  const date = parseDate(value);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function submitForm(event: FormEvent<HTMLFormElement>, action: (formData: FormData) => void) {
  event.preventDefault();
  action(new FormData(event.currentTarget));
}
