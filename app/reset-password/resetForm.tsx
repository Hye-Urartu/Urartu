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
import { resetPassword } from "@/lib/users";

export default function ResetPassword({
  className,
  csrfToken,
  resetToken,
  email,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [success, setSuccess] = React.useState(false);
  const signupSchema = z
    .object({
      email: z
        .string()
        .min(1, { message: "Email is required" })
        .email("This is not a valid email."),
      password: z.string().min(1, { message: "Password is required" }),
      confirmPassword: z
        .string()
        .min(1, { message: "Confirm Password is required" }),
    })
    .superRefine(({ confirmPassword, password }, ctx) => {
      if (confirmPassword != password) {
        ctx.addIssue({
          message: "Passwords do not match",
          path: ["confirmPassword"],
          code: "custom",
        });
      }
    });
  const captchaRef = React.createRef();
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: email,
      password: "",
      confirmPassword: "",
    },
  });
  const [signingUp, setSigningUp] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const router = useRouter();
  useEffect(() => {
    setSearch(window.location.search);
  }, []);

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setSigningUp(true);
    const token = await captchaRef.current.executeAsync();
    console.log(token, "asdf");
    console.log(window.location.search);
    const formBody = new URLSearchParams();
    formBody.append("email", values.email);
    formBody.append("password", values.password);
    let user;
    try {
      user = await resetPassword(csrfToken, {
        password: values.password,
        token: resetToken,
        captcha: token,
      });
    } catch (error) {
      console.log(error);
      setSigningUp(false);
    }
    console.log(user);
    setSigningUp(false);
    setSuccess(true);
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <img
            src={process.env.NEXT_PUBLIC_COMPANY_LOGO}
            alt={process.env.NEXT_PUBLIC_COMPANY_NAME}
            className="w-14 h-14 mx-auto rounded-lg"
          />
          <CardTitle className="text-xl">
            {success ? "Password reset." : "Reset Your Password"}
          </CardTitle>
          <CardDescription>
            {success
              ? "Your password was successfully reset. You can now log in with your new password."
              : "Pick a strong new password for your account"}
          </CardDescription>
        </CardHeader>
        {!success ? (
          <CardContent>
            <div className="grid gap-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <ReCaptcha
                    onAbort={() => setSigningUp(false)}
                    ref={captchaRef}
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                    onChange={(e: any) => console.log(e)}
                    size="invisible"
                  />
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <FormField
                        disabled
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="joseph@hyeararat.com"
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
                            </div>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-2">
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center">
                              <FormLabel>Confirm Password</FormLabel>
                            </div>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={signingUp}
                    >
                      <Spinner className="bg-black" loading={signingUp} /> Reset
                      Password
                    </Button>
                  </div>
                </form>
              </Form>
              {/*   <div className="text-center text-sm">
              Already have a {process.env.NEXT_PUBLIC_ACCOUNT_NAME}?{" "}
              <Link
                href={`/login${search}`}
                className="underline underline-offset-4"
              >
                Log in
              </Link>
            </div> */}
            </div>
          </CardContent>
        ) : null}
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
        Powered by <Link href="https://hyeurartu.com">Hye Urartu</Link>{" "}
      </div>
    </div>
  );
}
