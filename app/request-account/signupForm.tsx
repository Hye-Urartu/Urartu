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
import { Label } from "@/components/ui/label";
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
import { createUser, initiateSignUp } from "@/lib/users";

export default function SignUpForm({
  className,
  csrfToken,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const signupSchema = z.object({
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email("This is not a valid email."),
  });

  const captchaRef = React.createRef();
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
    },
  });
  const [signingUp, setSigningUp] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [emailSent, setEmailSent] = React.useState(false);
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
    let signUp;
    try {
      signUp = await initiateSignUp(csrfToken, {
        email: values.email,

        captcha: token,
      });
    } catch (error) {
      console.log(error);
      setSigningUp(false);
    }
    console.log(signUp);
    setEmailSent(true);
    setSigningUp(false);
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
            {emailSent ? (
              "We've sent an email to your inbox"
            ) : (
              <>Create a {process.env.NEXT_PUBLIC_ACCOUNT_NAME}</>
            )}
          </CardTitle>
          <CardDescription>
            {!emailSent
              ? "Enter your email address to continue."
              : "Check your inbox for further instructions."}
          </CardDescription>
        </CardHeader>
        {!emailSent ? (
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

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={signingUp}
                    >
                      <Spinner className="bg-black" loading={signingUp} /> Email
                      Sign Up Link
                    </Button>
                  </div>
                </form>
              </Form>
              <div className="text-center text-sm">
                Already have a {process.env.NEXT_PUBLIC_ACCOUNT_NAME}?{" "}
                <Link
                  href={`/login${search}`}
                  className="underline underline-offset-4"
                >
                  Log in
                </Link>
              </div>
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
