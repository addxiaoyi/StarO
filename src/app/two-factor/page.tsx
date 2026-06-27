import { AuthShell } from "@/components/auth/auth-shell";
import { TwoFactorForm } from "@/components/auth/auth-forms";

export default function TwoFactorPage() {
  return (
    <AuthShell
      title="确认是你本人"
      description="打开验证器应用输入 6 位数字，也可以让我们发一封邮件继续登录。"
    >
      <TwoFactorForm />
    </AuthShell>
  );
}
