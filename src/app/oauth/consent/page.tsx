import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/dashboard/app-shell";
import { OAuthActions } from "@/components/oauth/oauth-actions";
import { LinkButton } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
import { requireServerSession } from "@/lib/auth";
import {
  getScopeDescription,
  hasSensitiveScopes,
  SENSITIVE_OAUTH_SCOPES,
} from "@/lib/oauth-scope-policy";

const scopeCopy: Record<string, string> = {
  openid: "知道这是你的账号",
  profile: "查看你的基础资料",
  email: "查看你的邮箱",
  offline_access: "保留这次连接，下次少确认一次",
  "read:user": "查看你的账号资料",
  "read:organization": "查看你的团队名称和身份",
  // 新增 scope 描述
  write: "修改你的账号或组织信息",
};

function describeScopes(value: string) {
  return value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => scopeCopy[item] || getScopeDescription(item));
}

function describeApplication(value: string) {
  const normalized = value.replace(/[-_]+/g, " ").trim();

  if (!normalized) {
    return "这个应用";
  }

  if (normalized.length > 48) {
    return "这个应用";
  }

  return normalized;
}

function SensitiveScopeWarning({ scopes }: { scopes: string[] }) {
  const sensitiveOnes = scopes.filter((s) => SENSITIVE_OAUTH_SCOPES.includes(s));

  if (sensitiveOnes.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-300">
        <ShieldAlert size={16} />
        需要特别注意的权限
      </div>
      <ul className="mt-2 space-y-1 text-sm text-amber-100/80">
        {sensitiveOnes.map((scope) => (
          <li key={scope}>
            <span className="font-medium">{scope}</span>: {getScopeDescription(scope)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function OAuthConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await requireServerSession(new Headers(await headers()));
  if (!session?.user) {
    const callbackParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item) callbackParams.append(key, item);
        }
      } else if (value) {
        callbackParams.set(key, value);
      }
    }

    const callbackPath = callbackParams.size
      ? `/oauth/consent?${callbackParams.toString()}`
      : "/oauth/consent";

    redirect(`/sign-in?callbackURL=${encodeURIComponent(callbackPath)}`);
  }

  const hasAuthorizationRequest = Boolean(params.client_id || params.code);
  if (!hasAuthorizationRequest) {
    return (
      <AppShell>
        <section className="mx-auto w-full max-w-3xl py-10">
          <Panel>
            <div data-motion-primary>
              <StatusPill label="无需确认" tone="muted" />
              <h1 className="mt-4 text-3xl font-semibold text-white">现在没有应用需要你确认</h1>
            </div>
            <p className="mt-3 max-w-2xl text-zinc-500" data-motion-secondary>
              只有当你从其他应用跳转过来，并且它需要查看你的账号信息时，这里才会出现确认内容。
            </p>
            <div className="mt-6" data-motion-rise>
              <LinkButton href="/dashboard">
                返回账号中心 <ArrowRight size={17} />
              </LinkButton>
            </div>
          </Panel>
        </section>
      </AppShell>
    );
  }

  const applicationName = describeApplication(String(params.client_id || ""));
  const scope = String(params.scope || "openid profile email");
  const scopeItems = describeScopes(scope);
  const scopeList = scope.split(/\s+/).filter(Boolean);
  const showSensitiveWarning = hasSensitiveScopes(scopeList);

  return (
    <AppShell>
      <section className="mx-auto w-full max-w-3xl py-10">
        <Panel>
          <div data-motion-primary>
            <StatusPill label="应用访问" tone="ok" />
            <h1 className="mt-4 text-3xl font-semibold text-white">这个应用会看到这些信息</h1>
          </div>
          <p className="mt-3 text-zinc-500" data-motion-secondary>
            看清楚后再决定是否继续；不放心时可以先停下。
          </p>
          <p className="mt-2 text-sm text-zinc-600" data-motion-secondary>
            应用名称：{applicationName}
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4" data-motion-rise>
            <p className="text-sm font-semibold text-white">同意后它可以查看</p>
            <ul className="mt-3 grid gap-2 text-sm text-sky-100">
              {scopeItems.map((item) => (
                <li key={item} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {showSensitiveWarning && <SensitiveScopeWarning scopes={scopeList} />}
          <div className="mt-6" data-motion-rise>
            <Suspense fallback={<div className="text-sm text-zinc-500">正在准备确认选项...</div>}>
              <OAuthActions kind="consent" />
            </Suspense>
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
