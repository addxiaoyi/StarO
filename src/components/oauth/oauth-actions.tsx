"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { starxAuthClient } from "@/lib/auth-client";
import { toFriendlyAuthMessage } from "@/lib/friendly-auth-copy";

type ContinueKind = "consent" | "account" | "organization";
type OAuthDecision = "accept" | "deny" | "";

export function OAuthActions({ kind }: { kind: ContinueKind }) {
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [pendingDecision, setPendingDecision] = useState<OAuthDecision>("");
  const [error, setError] = useState("");
  const acceptPending = pendingDecision === "accept";
  const denyPending = pendingDecision === "deny";
  const busy = pending || Boolean(pendingDecision);
  const primaryLabel =
    kind === "consent"
      ? "同意并继续"
      : kind === "account"
        ? "使用这个账号继续"
        : "带上团队继续";
  const primaryPendingLabel = kind === "consent" ? "正在继续..." : "正在继续...";

  function continueFlow(accept: boolean) {
    setPendingDecision(accept ? "accept" : "deny");
    setError("");
    startTransition(async () => {
      try {
        const client = starxAuthClient();
        const code = searchParams.get("code") || "";
        const organizationId = searchParams.get("organizationId") || undefined;
        const payload =
          kind === "consent"
            ? { code, accept }
            : kind === "organization"
              ? { code, organizationId, postLogin: true }
              : { code, selected: true };

        const result = kind === "consent" ? await client.oauth2.consent(payload) : await client.oauth2.continue(payload);

        if (result?.error) {
          setError(toFriendlyAuthMessage(result.error.message, "没能继续，请稍后再试。"));
          return;
        }

        if (result?.data?.redirectURI) {
          window.location.href = result.data.redirectURI;
        }
      } finally {
        setPendingDecision("");
      }
    });
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" onClick={() => continueFlow(true)} disabled={busy} aria-busy={acceptPending}>
          {acceptPending ? <Loader2 className="animate-spin" size={17} /> : kind === "consent" ? <Check size={17} /> : <ArrowRight size={17} />}
          {acceptPending ? primaryPendingLabel : primaryLabel}
        </Button>
        {kind === "consent" ? (
          <Button type="button" variant="danger" onClick={() => continueFlow(false)} disabled={busy} aria-busy={denyPending}>
            {denyPending ? <Loader2 className="animate-spin" size={17} /> : <X size={17} />}
            {denyPending ? "正在处理..." : "先不继续"}
          </Button>
        ) : null}
      </div>
      {error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert" aria-live="polite">
          {error}
        </div>
      ) : null}
    </div>
  );
}
