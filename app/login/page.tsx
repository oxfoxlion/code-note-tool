import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Code Notebook</p>
          <h1 className="text-2xl font-semibold tracking-normal">登入工作區</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            使用 Email 與密碼，或使用暱稱與 PIN 登入。
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
