"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import React, { useEffect } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

import ReCaptcha from "react-google-recaptcha";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email("This is not a valid email."),
  password: z.string().min(1, { message: "Password is required" }),
});
export default function LoginForm({
  className,
  csrf,
  ...props
}: {
  className?: string;
  csrf: string;
} & React.ComponentPropsWithoutRef<"div"> & {
    csrf: string;
    registrationToken?: string;
    email?: string;
  }) {
  const captchaRef = React.createRef() as React.RefObject<ReCaptcha>;

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const [loggingIn, setLoggingIn] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const router = useRouter();
  useEffect(() => {
    setSearch(window.location.search);
  }, []);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoggingIn(true);
    const token = await captchaRef.current.executeAsync();
    console.log(window.location.search);
    const formBody = new URLSearchParams();
    formBody.append("email", values.email);
    formBody.append("password", values.password);
    formBody.append("captcha", token || "");
    let authorize;
    try {
      authorize = await fetch(`/authorize${window.location.search}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRF-Token": csrf,
        },
        body: formBody,
      });
    } catch (error) {
      setLoggingIn(false);
    }
    console.log(authorize?.headers.get("location"));
    console.log(authorize?.status);
    if (authorize?.status == 200) {
      router.push("/");
    }
  }
  return (
    <div className={cn("flex flex-col gap-6 ", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <img
            src={process.env.NEXT_PUBLIC_COMPANY_LOGO}
            alt={process.env.NEXT_PUBLIC_COMPANY_NAME}
            className="w-14 h-14 mx-auto rounded-lg"
          />
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your {process.env.NEXT_PUBLIC_ACCOUNT_NAME}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const state =
                    "google-" +
                    Math.random().toString(36).substring(7) +
                    "-" +
                    new URLSearchParams(window.location.search).get(
                      "client_id"
                    ) +
                    "-" +
                    new URLSearchParams(window.location.search).get(
                      "redirect_uri"
                    );
                  localStorage.setItem("CSRF", state);
                  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_URI}/callback&response_type=code&scope=openid%20email%20profile&method=google&state=${state}`;
                  window.location.assign(url);
                }}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                  className="h-4"
                />
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const state =
                    "github-" +
                    Math.random().toString(36).substring(7) +
                    "-" +
                    new URLSearchParams(window.location.search).get(
                      "client_id"
                    ) +
                    "-" +
                    new URLSearchParams(window.location.search).get(
                      "redirect_uri"
                    );
                  localStorage.setItem("CSRF", state);
                  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_URI}/callback&scope=user:email&state=${state}`;
                  //popup
                  window.location.assign(url);
                }}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Octicons-mark-github.svg/600px-Octicons-mark-github.svg.png"
                  className="h-4 invert"
                />
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const state =
                    "discord-" +
                    Math.random().toString(36).substring(7) +
                    "-" +
                    new URLSearchParams(window.location.search).get(
                      "client_id"
                    ) +
                    "-" +
                    new URLSearchParams(window.location.search).get(
                      "redirect_uri"
                    );
                  localStorage.setItem("CSRF", state);
                  const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_URI}/callback&response_type=code&scope=identify%20email&state=${state}`;
                  //popup
                  window.location.assign(url);
                }}
              >
                <img
                  src="https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg"
                  className="h-4 p-[2px]"
                />
              </Button>
            </div>
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <ReCaptcha
                  onAbort={() => setLoggingIn(false)}
                  ref={captchaRef}
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string}
                  onChange={(e: any) => console.log(e)}
                  size="invisible"
                />
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="joseph@hyecompany.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center">
                            <FormLabel>Password</FormLabel>
                            <Link
                              href="/request-password-reset"
                              className="ml-auto text-sm underline-offset-4 hover:underline"
                            >
                              Forgot your password?
                            </Link>
                          </div>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loggingIn}>
                    <Spinner className="bg-black" loading={loggingIn} /> Login
                  </Button>
                </div>
              </form>
            </Form>
            <div className="text-center text-sm">
              Don&apos;t have a {process.env.NEXT_PUBLIC_ACCOUNT_NAME}?{" "}
              <Link
                href={`/request-account${search}`}
                className="underline underline-offset-4"
              >
                Create One
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
        Powered by <Link href="https://hyecompany.com">Hye Urartu</Link>{" "}
      </div>
    </div>
  );
}
