"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, LogIn, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ApiConnectionError,
  ApiError,
  authApi,
} from "@/lib/code-notebook/api-client";
import { codeNotebookQueryKeys } from "@/lib/code-notebook/query-keys";
import type { LoginInput, RequireTwoFactorResponse } from "@/lib/code-notebook/types";

type LoginMode = "password" | "pin";

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof ApiConnectionError) {
    return error.message;
  }

  return "登入失敗，請稍後再試";
}

function createLoginInput(mode: LoginMode, values: LoginFormValues): LoginInput {
  if (mode === "password") {
    return {
      email: values.email.trim(),
      password: values.password,
    };
  }

  return {
    nickname: values.nickname.trim(),
    pin: values.pin,
  };
}

function isMissingCredentials(mode: LoginMode, values: LoginFormValues) {
  if (mode === "password") {
    return values.email.trim() === "" || values.password === "";
  }

  return values.nickname.trim() === "" || values.pin === "";
}

interface LoginFormValues {
  email: string;
  password: string;
  nickname: string;
  pin: string;
}

const initialValues: LoginFormValues = {
  email: "",
  password: "",
  nickname: "",
  pin: "",
};

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<LoginMode>("password");
  const [values, setValues] = useState(initialValues);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorChallenge, setTwoFactorChallenge] =
    useState<RequireTwoFactorResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const finishAuthentication = (message: string) => {
    queryClient.invalidateQueries({ queryKey: codeNotebookQueryKeys.auth.me });
    toast.success(message);
    router.replace("/");
  };

  const login = useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (response) => {
      setFormError(null);

      if (response.require2FA) {
        setTwoFactorChallenge(response);
        toast.info("需要兩步驟驗證");
        return;
      }

      finishAuthentication(response.message);
    },
    onError: (error) => {
      setFormError(getErrorMessage(error));
    },
  });

  const verify2FA = useMutation({
    mutationFn: () => {
      if (!twoFactorChallenge) {
        throw new Error("缺少兩步驟驗證資訊");
      }

      return authApi.verify2FA({
        userId: twoFactorChallenge.userId,
        token: twoFactorToken.trim(),
      });
    },
    onSuccess: (response) => {
      setFormError(null);
      finishAuthentication(response.message);
    },
    onError: (error) => {
      setFormError(getErrorMessage(error));
    },
  });

  const isSubmitting = login.isPending || verify2FA.isPending;

  const updateValue = (field: keyof LoginFormValues, value: string) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
  };

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isMissingCredentials(mode, values)) {
      setFormError("請填寫登入資訊");
      return;
    }

    login.mutate(createLoginInput(mode, values));
  };

  const submitTwoFactor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (twoFactorToken.trim().length !== 6) {
      setFormError("請輸入六位數驗證碼");
      return;
    }

    verify2FA.mutate();
  };

  if (twoFactorChallenge) {
    return (
      <form className="space-y-5" onSubmit={submitTwoFactor}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="size-4" />
            兩步驟驗證
          </div>
          <p className="text-sm text-muted-foreground">
            請輸入 {twoFactorChallenge.displayName} 的六位數驗證碼。
          </p>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium">驗證碼</span>
          <Input
            value={twoFactorToken}
            onChange={(event) => setTwoFactorToken(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            disabled={isSubmitting}
          />
        </label>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            驗證並登入
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => {
              setTwoFactorChallenge(null);
              setTwoFactorToken("");
              setFormError(null);
            }}
          >
            返回
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form className="space-y-5" onSubmit={submitLogin}>
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
        <Button
          type="button"
          variant={mode === "password" ? "secondary" : "ghost"}
          onClick={() => setMode("password")}
          disabled={isSubmitting}
        >
          <Mail className="size-4" />
          Email
        </Button>
        <Button
          type="button"
          variant={mode === "pin" ? "secondary" : "ghost"}
          onClick={() => setMode("pin")}
          disabled={isSubmitting}
        >
          <UserRound className="size-4" />
          暱稱
        </Button>
      </div>

      {mode === "password" ? (
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email</span>
            <Input
              type="email"
              value={values.email}
              onChange={(event) => updateValue("email", event.target.value)}
              autoComplete="email"
              disabled={isSubmitting}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">密碼</span>
            <Input
              type="password"
              value={values.password}
              onChange={(event) => updateValue("password", event.target.value)}
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium">暱稱</span>
            <Input
              value={values.nickname}
              onChange={(event) => updateValue("nickname", event.target.value)}
              autoComplete="username"
              disabled={isSubmitting}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">PIN</span>
            <Input
              type="password"
              value={values.pin}
              onChange={(event) => updateValue("pin", event.target.value)}
              inputMode="numeric"
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </label>
        </div>
      )}

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : mode === "password" ? (
          <KeyRound className="size-4" />
        ) : (
          <LogIn className="size-4" />
        )}
        登入
      </Button>
    </form>
  );
}
