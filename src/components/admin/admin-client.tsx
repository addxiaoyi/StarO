"use client";

import { useCallback, useEffect, useMemo, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Loader2, RefreshCw, Search, ShieldAlert, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { TextField } from "@/components/ui/text-field";
import { starxAuthClient } from "@/lib/auth-client";
import { toFriendlyAuthMessage } from "@/lib/friendly-auth-copy";

const USER_LIST_LIMIT = 20;

const fieldClass =
  "focus-ring h-12 rounded-2xl border border-white/12 bg-black/35 px-4 text-base text-white transition focus:border-sky-300/70";

type SearchField = "email" | "name";
type ListAction = "initial" | "search" | "refresh" | "clear" | "";
type AdminAction = "create-user" | "revoke-sessions" | "ban-user" | "";

type AdminUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | string[] | null;
  banned?: boolean | null;
  banReason?: string | null;
  emailVerified?: boolean | null;
};

type LoadUsersOptions = {
  value?: string;
  field?: SearchField;
  quiet?: boolean;
  action?: ListAction;
};

export function AdminClient() {
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<AdminAction>("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [listAction, setListAction] = useState<ListAction>("initial");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("email");
  const [activeSearch, setActiveSearch] = useState<{ value: string; field: SearchField }>({ value: "", field: "email" });
  const [selectedUserId, setSelectedUserId] = useState("");
  const [listError, setListError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [selectedUserId, users],
  );
  const adminBusy = pending || Boolean(pendingAction);
  const actionPending = (action: AdminAction) => pendingAction === action;

  const loadUsers = useCallback(async ({ value = "", field = "email", quiet = false, action = "refresh" }: LoadUsersOptions = {}) => {
    const trimmedValue = value.trim();

    if (!quiet) {
      setUsersLoading(true);
      setListAction(action);
    }

    setListError("");

    try {
      const query: {
        limit: number;
        offset: number;
        searchValue?: string;
        searchField?: SearchField;
        searchOperator?: "contains";
      } = {
        limit: USER_LIST_LIMIT,
        offset: 0,
      };

      if (trimmedValue) {
        query.searchValue = trimmedValue;
        query.searchField = field;
        query.searchOperator = "contains";
      }

      const client = starxAuthClient();
      const result = await client.admin.listUsers({ query });

      if (result?.error) {
        const friendly = toFriendlyAuthMessage(result.error.message, "成员列表暂时无法加载，请稍后再试。");
        setListError(friendly);
        return;
      }

      const nextUsers = (result?.data?.users || []).filter((user): user is AdminUser => Boolean(user?.id));
      setUsers(nextUsers);
      setTotal(result?.data?.total ?? nextUsers.length);
      setActiveSearch({ value: trimmedValue, field });
      setSelectedUserId((current) => (current && nextUsers.some((user) => user.id === current) ? current : ""));
    } catch {
      setListError("成员列表暂时无法加载，请稍后再试。");
    } finally {
      setUsersLoading(false);
      if (!quiet) {
        setListAction("");
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers({ action: "initial" });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  function searchUsers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadUsers({ value: searchValue, field: searchField, action: "search" });
  }

  function refreshUsers() {
    void loadUsers({ value: searchValue, field: searchField, action: "refresh" });
  }

  function clearSearch() {
    setSearchValue("");
    void loadUsers({ value: "", field: searchField, action: "clear" });
  }

  function createUser(formData: FormData) {
    setPendingAction("create-user");
    startTransition(async () => {
      try {
        const name = String(formData.get("name") || "");
        const email = String(formData.get("email") || "");

        const client = starxAuthClient();
        const result = await client.admin.createUser({
          name,
          email,
          password: String(formData.get("password") || ""),
          role: String(formData.get("role") || "user"),
        });

        if (result?.error) {
          setMessage("");
          setError(toFriendlyAuthMessage(result.error.message, "添加成员失败，请检查信息后重试。"));
          return;
        }

        setError("");
        setMessage(`已添加 ${name.trim() || email.trim()}，成员列表已更新。`);
        await loadUsers({ value: searchValue, field: searchField, quiet: true });
      } finally {
        setPendingAction("");
      }
    });
  }

  function revokeSessions(formData: FormData) {
    setPendingAction("revoke-sessions");
    startTransition(async () => {
      try {
        const userId = String(formData.get("userId") || "");

        if (!userId) {
          setMessage("");
          setError("请先在成员列表选择要处理的成员。");
          return;
        }

        const user = users.find((item) => item.id === userId);
        const client = starxAuthClient();
        const result = await client.admin.revokeUserSessions({ userId });

        if (result?.error) {
          setMessage("");
          setError(toFriendlyAuthMessage(result.error.message, "现在不能让该成员的设备退出，请稍后再试。"));
          return;
        }

        setError("");
        setMessage(`已让 ${displayUserName(user)} 的设备退出。下次使用时需要重新登录。`);
      } finally {
        setPendingAction("");
      }
    });
  }

  function banUser(formData: FormData) {
    setPendingAction("ban-user");
    startTransition(async () => {
      try {
        const userId = String(formData.get("userId") || "");
        const reason = String(formData.get("reason") || "管理员操作");

        if (!userId) {
          setMessage("");
          setError("请先在成员列表选择要暂停的成员。");
          return;
        }

        const user = users.find((item) => item.id === userId);
        const client = starxAuthClient();
        const result = await client.admin.banUser({ userId, banReason: reason });

        if (result?.error) {
          setMessage("");
          setError(toFriendlyAuthMessage(result.error.message, "无法暂停这个账号，请稍后再试。"));
          return;
        }

        setError("");
        setMessage(`已暂停 ${displayUserName(user)}。该成员暂时不能登录。`);
        await loadUsers({ value: searchValue, field: searchField, quiet: true });
      } finally {
        setPendingAction("");
      }
    });
  }

  const totalLabel = total > users.length ? `显示 ${users.length} / ${total}` : `${users.length} 个成员`;
  const hasActiveSearch = activeSearch.value.length > 0;
  const emptyStateTitle = hasActiveSearch ? "没有找到匹配成员" : "还没有成员";
  const emptyStateDescription = hasActiveSearch
    ? `没有找到${searchFieldLabel(activeSearch.field)}里包含“${activeSearch.value}”的成员。换个关键词试试，或清空搜索后刷新列表。`
    : "现在还没有成员。可以先用下方“添加成员”创建第一个账号。";

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <section className="surface rounded-[1.65rem] p-5 lg:col-span-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex rounded-2xl bg-white/8 p-3 text-white">
              <Users size={20} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">成员列表</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">先选择成员，再处理设备登录或暂停账号。</p>
          </div>
          <StatusPill label={usersLoading ? "加载中" : totalLabel} tone={usersLoading ? "warn" : "muted"} />
        </div>

        <form onSubmit={searchUsers} className="mt-5 grid gap-3 lg:grid-cols-[1fr_10rem_auto_auto_auto] lg:items-end">
          <TextField
            label="搜索成员"
            name="searchValue"
            placeholder={searchField === "email" ? "输入邮箱" : "输入姓名"}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
          <label className="grid gap-2 text-sm text-zinc-200">
            <span className="font-medium">搜索范围</span>
            <select
              className={fieldClass}
              value={searchField}
              onChange={(event) => setSearchField(event.target.value as SearchField)}
            >
              <option value="email">邮箱</option>
              <option value="name">姓名</option>
            </select>
          </label>
          <Button
            type="submit"
            variant="secondary"
            disabled={usersLoading}
            className="lg:mb-0"
            aria-busy={usersLoading && listAction === "search"}
          >
            {usersLoading && listAction === "search" ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {usersLoading && listAction === "search" ? "正在搜索..." : "搜索"}
          </Button>
          <Button type="button" variant="ghost" disabled={usersLoading} onClick={refreshUsers} aria-busy={usersLoading && listAction === "refresh"}>
            {usersLoading && listAction === "refresh" ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {usersLoading && listAction === "refresh" ? "正在刷新..." : "刷新列表"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={usersLoading || !searchValue.trim()}
            onClick={clearSearch}
            aria-busy={usersLoading && listAction === "clear"}
          >
            {usersLoading && listAction === "clear" ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
            {usersLoading && listAction === "clear" ? "正在清空..." : "清空搜索"}
          </Button>
        </form>

        <div className="mt-5 grid gap-3" aria-busy={usersLoading}>
          {listError ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">
              {listError}
            </div>
          ) : null}

          {!usersLoading && !listError && users.length === 0 ? (
            <div
              className="rounded-2xl border border-white/12 bg-black/25 px-4 py-5 text-sm text-zinc-400"
              role="status"
              aria-live="polite"
            >
              <div className="font-semibold text-zinc-200">{emptyStateTitle}</div>
              <div className="mt-1 leading-6">{emptyStateDescription}</div>
            </div>
          ) : null}

          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              selected={user.id === selectedUserId}
              onSelect={() => setSelectedUserId(user.id)}
            />
          ))}
        </div>
      </section>

      <AdminCard icon={<UserPlus size={20} />} title="添加成员" description="给成员开通登录账号，并选择普通成员或管理员。">
        <form onSubmit={(event) => submitForm(event, createUser)} className="grid gap-3">
          <TextField label="姓名" name="name" placeholder="成员姓名" required />
          <TextField label="邮箱" name="email" type="email" placeholder="admin@example.com" required />
          <TextField label="密码" name="password" type="password" placeholder="至少 8 位" minLength={8} required />
          <label className="grid gap-2 text-sm text-zinc-200">
            <span className="font-medium">成员身份</span>
            <select name="role" className={fieldClass} defaultValue="user">
              <option value="user">成员</option>
              <option value="admin">管理员</option>
            </select>
          </label>
          <Button type="submit" variant="secondary" disabled={adminBusy} aria-busy={actionPending("create-user")}>
            {actionPending("create-user") ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {actionPending("create-user") ? "正在添加..." : "添加成员"}
          </Button>
        </form>
      </AdminCard>

      <AdminCard icon={<ShieldCheck size={20} />} title="让成员设备退出" description="让选中的成员在所有设备上重新登录，适合账号疑似被别人使用时处理。">
        <form onSubmit={(event) => submitForm(event, revokeSessions)} className="grid gap-3">
          <SelectedUserSummary user={selectedUser} />
          <input type="hidden" name="userId" value={selectedUserId} />
          <Button type="submit" variant="secondary" disabled={adminBusy || !selectedUserId} aria-busy={actionPending("revoke-sessions")}>
            {actionPending("revoke-sessions") ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {actionPending("revoke-sessions") ? "正在处理..." : "让设备退出"}
          </Button>
        </form>
      </AdminCard>

      <AdminCard icon={<ShieldAlert size={20} />} title="暂停账号" description="临时阻止选中的成员登录，解除前无法继续使用账号。">
        <form onSubmit={(event) => submitForm(event, banUser)} className="grid gap-3">
          <SelectedUserSummary user={selectedUser} />
          <input type="hidden" name="userId" value={selectedUserId} />
          <TextField label="原因" name="reason" placeholder="安全风险" />
          <Button type="submit" variant="danger" disabled={adminBusy || !selectedUserId} aria-busy={actionPending("ban-user")}>
            {actionPending("ban-user") ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
            {actionPending("ban-user") ? "正在暂停..." : "暂停账号"}
          </Button>
        </form>
      </AdminCard>

      {message || error ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm lg:col-span-3 ${error ? "border-red-400/30 bg-red-500/10 text-red-100" : "border-sky-300/30 bg-sky-400/10 text-sky-100"}`}
          role={error ? "alert" : "status"}
          aria-live="polite"
        >
          {adminBusy ? <Loader2 className="mr-2 inline animate-spin" size={16} /> : null}
          {error || message}
        </div>
      ) : null}
    </div>
  );
}

function AdminCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
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

function UserRow({ user, selected, onSelect }: { user: AdminUser; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      className={`focus-ring grid w-full gap-3 rounded-2xl border p-4 text-left transition sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${
        selected ? "border-sky-300/55 bg-sky-400/10" : "border-white/12 bg-black/25 hover:border-white/22 hover:bg-white/[0.055]"
      }`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-base font-semibold text-white">{displayUserName(user)}</span>
          {user.emailVerified === false ? <MiniPill label="邮箱未验证" tone="warn" /> : null}
        </span>
        <span className="mt-1 block truncate text-sm text-zinc-500">{user.email || "未填写邮箱"}</span>
      </span>
      <span className="flex flex-wrap items-center gap-2 sm:justify-end">
        <MiniPill label={roleLabel(user.role)} />
        <MiniPill label={user.banned ? "已暂停" : "可登录"} tone={user.banned ? "danger" : "ok"} />
        <span className="inline-flex h-8 items-center gap-1 rounded-full border border-white/12 px-3 text-xs font-semibold text-zinc-200">
          {selected ? <CheckCircle2 size={14} /> : null}
          {selected ? "已选择" : "选择"}
        </span>
      </span>
    </button>
  );
}

function SelectedUserSummary({ user }: { user: AdminUser | null }) {
  if (!user) {
    return (
      <div
        className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-zinc-400"
        role="status"
        aria-live="polite"
      >
        先从成员列表选择一个成员。
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sky-300/35 bg-sky-400/10 px-4 py-3" role="status" aria-live="polite">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-100/70">已选择</div>
      <div className="mt-1 truncate text-sm font-semibold text-white">{displayUserName(user)}</div>
      <div className="mt-1 truncate text-xs text-sky-100/75">{user.email || "未填写邮箱"}</div>
    </div>
  );
}

function MiniPill({ label, tone = "muted" }: { label: string; tone?: "ok" | "warn" | "danger" | "muted" }) {
  const toneClass = {
    ok: "border-emerald-300/35 bg-emerald-400/10 text-emerald-100",
    warn: "border-yellow-300/35 bg-yellow-300/10 text-yellow-100",
    danger: "border-red-400/35 bg-red-500/10 text-red-100",
    muted: "border-white/12 bg-white/[0.045] text-zinc-300",
  };

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass[tone]}`}>{label}</span>;
}

function displayUserName(user?: AdminUser | null) {
  return user?.name?.trim() || user?.email || "该成员";
}

function searchFieldLabel(field: SearchField) {
  return field === "name" ? "姓名" : "邮箱";
}

function roleLabel(role?: string | string[] | null) {
  const roles = Array.isArray(role) ? role : role ? [role] : ["user"];
  return roles.map((item) => (item === "admin" ? "管理员" : item === "user" ? "成员" : item)).join("、");
}

function submitForm(event: FormEvent<HTMLFormElement>, action: (formData: FormData) => void) {
  event.preventDefault();
  action(new FormData(event.currentTarget));
}
