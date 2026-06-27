"use client";

import { useCallback, useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { AppWindow, Check, Copy, Loader2, Plus, RefreshCw, RotateCw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { TextField } from "@/components/ui/text-field";
import { toFriendlyAuthMessage } from "@/lib/friendly-auth-copy";

const fieldClass =
  "focus-ring min-h-12 rounded-2xl border border-white/12 bg-black/35 px-4 py-3 text-base text-white transition focus:border-sky-300/70";

type OAuthClient = {
  client_id: string;
  client_secret?: string;
  client_name?: string | null;
  client_uri?: string | null;
  redirect_uris?: string[] | null;
  scope?: string | null;
  type?: "web" | "native" | "user-agent-based" | string | null;
  disabled?: boolean | null;
  public?: boolean | null;
  client_id_issued_at?: number | null;
};

type NewSecret = {
  clientId: string;
  secret: string;
};

async function authJson<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`/api/auth${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = typeof data?.message === "string" ? data.message : typeof data?.error === "string" ? data.error : "";
    throw new Error(toFriendlyAuthMessage(message, "应用信息暂时没有处理成功，请稍后再试。"));
  }

  return data as T;
}

function parseUrlList(value: FormDataEntryValue | null) {
  const urls = String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  for (const url of urls) {
    try {
      new URL(url);
    } catch {
      throw new Error("请输入完整地址，例如 https://app.example.com/callback。");
    }
  }

  return urls;
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || undefined;
}

export function ApplicationsClient() {
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState("");
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [copiedValue, setCopiedValue] = useState("");
  const [newSecret, setNewSecret] = useState<NewSecret | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const busy = pending || Boolean(pendingAction);
  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => (b.client_id_issued_at || 0) - (a.client_id_issued_at || 0)),
    [clients],
  );

  const showMessage = useCallback((value: string, secret: NewSecret | null = null) => {
    setError("");
    setMessage(value);
    setNewSecret(secret);
    setCopiedValue("");
  }, []);

  const showError = useCallback((value: string) => {
    setMessage("");
    setError(value);
    setNewSecret(null);
    setCopiedValue("");
  }, []);

  const loadClients = useCallback(async (quiet = false) => {
    if (!quiet) {
      setPendingAction("load");
    }

    try {
      const result = await authJson<OAuthClient[] | null>("/oauth2/get-clients");
      setClients(result || []);
      if (!quiet) {
        setError("");
      }
    } catch (loadError) {
      showError(loadError instanceof Error ? loadError.message : "应用列表暂时无法加载，请稍后再试。");
    } finally {
      if (!quiet) {
        setPendingAction("");
      }
    }
  }, [showError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadClients();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadClients]);

  function createClient(formData: FormData) {
    setPendingAction("create");
    startTransition(async () => {
      try {
        const redirectUris = parseUrlList(formData.get("redirect_uris"));

        if (!redirectUris.length) {
          showError("请至少填写一个回调地址。");
          return;
        }

        const result = await authJson<OAuthClient>("/oauth2/create-client", {
          method: "POST",
          body: JSON.stringify({
            client_name: optionalString(formData.get("client_name")),
            client_uri: optionalString(formData.get("client_uri")),
            redirect_uris: redirectUris,
            scope: optionalString(formData.get("scope")) || "openid profile email",
            type: optionalString(formData.get("type")) || "web",
            token_endpoint_auth_method: optionalString(formData.get("token_endpoint_auth_method")) || "client_secret_basic",
          }),
        });

        await loadClients(true);
        showMessage(
          "接入应用已创建。应用密钥只会显示这一次，请现在复制保存。",
          result.client_secret ? { clientId: result.client_id, secret: result.client_secret } : null,
        );
      } catch (createError) {
        showError(createError instanceof Error ? createError.message : "接入应用没有创建成功，请稍后再试。");
      } finally {
        setPendingAction("");
      }
    });
  }

  function updateClient(formData: FormData) {
    const clientId = String(formData.get("client_id") || "");
    setPendingAction(`update:${clientId}`);
    startTransition(async () => {
      try {
        const redirectUris = parseUrlList(formData.get("redirect_uris"));

        if (!redirectUris.length) {
          showError("请至少保留一个回调地址。");
          return;
        }

        await authJson<OAuthClient>("/oauth2/update-client", {
          method: "POST",
          body: JSON.stringify({
            client_id: clientId,
            update: {
              client_name: optionalString(formData.get("client_name")),
              client_uri: optionalString(formData.get("client_uri")),
              redirect_uris: redirectUris,
              scope: optionalString(formData.get("scope")) || "openid profile email",
              type: optionalString(formData.get("type")) || "web",
            },
          }),
        });

        await loadClients(true);
        showMessage("接入应用已更新。");
      } catch (updateError) {
        showError(updateError instanceof Error ? updateError.message : "接入应用没有更新成功，请稍后再试。");
      } finally {
        setPendingAction("");
      }
    });
  }

  function rotateSecret(clientId: string) {
    setPendingAction(`rotate:${clientId}`);
    startTransition(async () => {
      try {
        const result = await authJson<OAuthClient>("/oauth2/client/rotate-secret", {
          method: "POST",
          body: JSON.stringify({ client_id: clientId }),
        });

        await loadClients(true);
        showMessage(
          "应用密钥已轮换。新密钥只会显示这一次，请现在复制保存。",
          result.client_secret ? { clientId, secret: result.client_secret } : null,
        );
      } catch (rotateError) {
        showError(rotateError instanceof Error ? rotateError.message : "应用密钥没有轮换成功，请稍后再试。");
      } finally {
        setPendingAction("");
      }
    });
  }

  function deleteClient(clientId: string) {
    if (!window.confirm("确认移除这个接入应用吗？移除后它不能再继续接入账号中心。")) {
      return;
    }

    setPendingAction(`delete:${clientId}`);
    startTransition(async () => {
      try {
        await authJson<void>("/oauth2/delete-client", {
          method: "POST",
          body: JSON.stringify({ client_id: clientId }),
        });

        await loadClients(true);
        showMessage("接入应用已移除。");
      } catch (deleteError) {
        showError(deleteError instanceof Error ? deleteError.message : "接入应用没有移除成功，请稍后再试。");
      } finally {
        setPendingAction("");
      }
    });
  }

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(`${label}:${value}`);
    } catch {
      showMessage("复制失败，请手动选中文本后复制。", newSecret);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="surface rounded-[1.65rem] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex rounded-2xl bg-white/8 p-3 text-white">
              <Plus size={20} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">登记接入应用</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">填写应用名称和回调地址，创建后会得到应用编号和一次性密钥。</p>
          </div>
          <StatusPill label={`${clients.length} 个应用`} tone="muted" />
        </div>

        <form onSubmit={(event) => submitForm(event, createClient)} className="mt-5 grid gap-4 lg:grid-cols-2">
          <TextField label="应用名称" name="client_name" placeholder="例如：工作台插件" required />
          <TextField label="应用主页" name="client_uri" type="url" placeholder="https://app.example.com" />
          <label className="grid gap-2 text-sm text-zinc-200 lg:col-span-2">
            <span className="font-medium">回调地址</span>
            <textarea
              name="redirect_uris"
              className={`${fieldClass} min-h-24 resize-y`}
              placeholder="https://app.example.com/callback"
              required
            />
          </label>
          <TextField label="允许查看的信息" name="scope" placeholder="openid profile email" />
          <label className="grid gap-2 text-sm text-zinc-200">
            <span className="font-medium">应用类型</span>
            <select name="type" className={fieldClass} defaultValue="web">
              <option value="web">网页应用</option>
              <option value="native">本地应用</option>
              <option value="user-agent-based">浏览器内应用</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-zinc-200">
            <span className="font-medium">密钥使用方式</span>
            <select name="token_endpoint_auth_method" className={fieldClass} defaultValue="client_secret_basic">
              <option value="client_secret_basic">请求头携带密钥</option>
              <option value="client_secret_post">请求体携带密钥</option>
              <option value="none">不使用密钥</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button type="submit" variant="secondary" disabled={busy} aria-busy={pendingAction === "create"}>
              {pendingAction === "create" ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
              {pendingAction === "create" ? "正在创建..." : "创建接入应用"}
            </Button>
          </div>
        </form>
      </section>

      <section className="surface rounded-[1.65rem] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex rounded-2xl bg-white/8 p-3 text-white">
              <AppWindow size={20} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">已登记应用</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">可以更新回调地址、轮换密钥，或移除不再使用的应用。</p>
          </div>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => void loadClients()}>
            {pendingAction === "load" ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {pendingAction === "load" ? "正在刷新..." : "刷新列表"}
          </Button>
        </div>

        <div className="mt-5 grid gap-3" aria-busy={pendingAction === "load"}>
          {sortedClients.length === 0 && pendingAction !== "load" ? (
            <div className="rounded-2xl border border-white/12 bg-black/25 px-4 py-5 text-sm text-zinc-400" role="status">
              <div className="font-semibold text-zinc-200">还没有接入应用</div>
              <div className="mt-1 leading-6">先登记一个需要接入账号中心的应用。</div>
            </div>
          ) : null}

          {sortedClients.map((client) => (
            <ApplicationRow
              key={client.client_id}
              client={client}
              busy={busy}
              pendingAction={pendingAction}
              copiedValue={copiedValue}
              onCopy={copyValue}
              onUpdate={updateClient}
              onRotate={rotateSecret}
              onDelete={deleteClient}
            />
          ))}
        </div>
      </section>

      {message || error ? (
        <div
          aria-live="polite"
          role={error ? "alert" : "status"}
          className={`rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-400/30 bg-red-500/10 text-red-100" : "border-sky-300/30 bg-sky-400/10 text-sky-100"}`}
        >
          <p>{error || message}</p>
          {newSecret ? (
            <div className="mt-3 grid gap-3">
              <SecretLine label="应用编号" value={newSecret.clientId} copiedValue={copiedValue} onCopy={copyValue} />
              <SecretLine label="应用密钥" value={newSecret.secret} copiedValue={copiedValue} onCopy={copyValue} />
              <p className="text-xs leading-5 text-sky-100/75">密钥离开页面后不会再次显示。请保存到应用的服务端配置里。</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ApplicationRow({
  client,
  busy,
  pendingAction,
  copiedValue,
  onCopy,
  onUpdate,
  onRotate,
  onDelete,
}: {
  client: OAuthClient;
  busy: boolean;
  pendingAction: string;
  copiedValue: string;
  onCopy: (label: string, value: string) => void;
  onUpdate: (formData: FormData) => void;
  onRotate: (clientId: string) => void;
  onDelete: (clientId: string) => void;
}) {
  const redirectText = (client.redirect_uris || []).join("\n");
  const appName = client.client_name || "未命名应用";

  return (
    <article className="rounded-2xl border border-white/12 bg-black/25 p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-white">{appName}</h3>
            <StatusPill label={client.disabled ? "已停用" : "可使用"} tone={client.disabled ? "warn" : "ok"} />
            <StatusPill label={typeLabel(client.type)} tone="muted" />
          </div>
          <div className="mt-2 grid gap-2 text-sm text-zinc-500">
            <CodeLine label="应用编号" value={client.client_id} copiedValue={copiedValue} onCopy={onCopy} />
            <p>创建时间：{formatIssuedAt(client.client_id_issued_at)}</p>
            <p>允许查看：{client.scope || "openid profile email"}</p>
            <p className="break-all">回调地址：{client.redirect_uris?.join("、") || "未填写"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onRotate(client.client_id)}>
            {pendingAction === `rotate:${client.client_id}` ? <Loader2 className="animate-spin" size={16} /> : <RotateCw size={16} />}
            {pendingAction === `rotate:${client.client_id}` ? "正在轮换..." : "轮换密钥"}
          </Button>
          <Button type="button" variant="danger" disabled={busy} onClick={() => onDelete(client.client_id)}>
            {pendingAction === `delete:${client.client_id}` ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            {pendingAction === `delete:${client.client_id}` ? "正在移除..." : "移除应用"}
          </Button>
        </div>
      </div>

      <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-200">编辑应用信息</summary>
        <form onSubmit={(event) => submitForm(event, onUpdate)} className="mt-4 grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="client_id" value={client.client_id} />
          <TextField label="应用名称" name="client_name" defaultValue={client.client_name || ""} required />
          <TextField label="应用主页" name="client_uri" type="url" defaultValue={client.client_uri || ""} />
          <label className="grid gap-2 text-sm text-zinc-200 lg:col-span-2">
            <span className="font-medium">回调地址</span>
            <textarea name="redirect_uris" className={`${fieldClass} min-h-24 resize-y`} defaultValue={redirectText} required />
          </label>
          <TextField label="允许查看的信息" name="scope" defaultValue={client.scope || "openid profile email"} />
          <label className="grid gap-2 text-sm text-zinc-200">
            <span className="font-medium">应用类型</span>
            <select name="type" className={fieldClass} defaultValue={client.type || "web"}>
              <option value="web">网页应用</option>
              <option value="native">本地应用</option>
              <option value="user-agent-based">浏览器内应用</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button type="submit" variant="secondary" disabled={busy} aria-busy={pendingAction === `update:${client.client_id}`}>
              {pendingAction === `update:${client.client_id}` ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
              {pendingAction === `update:${client.client_id}` ? "正在保存..." : "保存应用"}
            </Button>
          </div>
        </form>
      </details>
    </article>
  );
}

function SecretLine({
  label,
  value,
  copiedValue,
  onCopy,
}: {
  label: string;
  value: string;
  copiedValue: string;
  onCopy: (label: string, value: string) => void;
}) {
  const copied = copiedValue === `${label}:${value}`;

  return (
    <div className="grid gap-2 rounded-xl border border-white/10 bg-black/25 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="text-xs text-sky-100/75">{label}</p>
        <p className="break-all font-mono text-xs leading-6 text-white">{value}</p>
      </div>
      <Button type="button" variant="secondary" className="shrink-0" onClick={() => onCopy(label, value)}>
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "已复制" : "复制"}
      </Button>
    </div>
  );
}

function CodeLine({
  label,
  value,
  copiedValue,
  onCopy,
}: {
  label: string;
  value: string;
  copiedValue: string;
  onCopy: (label: string, value: string) => void;
}) {
  const copied = copiedValue === `${label}:${value}`;

  return (
    <span className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <span>
        {label}：<span className="break-all font-mono text-zinc-300">{value}</span>
      </span>
      <button
        type="button"
        className="focus-ring inline-flex w-fit items-center gap-1 rounded-full border border-white/12 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:bg-white/[0.07]"
        onClick={() => onCopy(label, value)}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "已复制" : "复制"}
      </button>
    </span>
  );
}

function formatIssuedAt(value?: number | null) {
  if (!value) {
    return "未知";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value * 1000));
}

function typeLabel(value?: OAuthClient["type"]) {
  if (value === "native") {
    return "本地应用";
  }

  if (value === "user-agent-based") {
    return "浏览器内应用";
  }

  return "网页应用";
}

function submitForm(event: FormEvent<HTMLFormElement>, action: (formData: FormData) => void) {
  event.preventDefault();
  action(new FormData(event.currentTarget));
}
