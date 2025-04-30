"use client";

import { cn } from "@/lib/utils";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import React, { useEffect } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Spinner } from "@/components/ui/spinner";

import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email("This is not a valid email."),
  password: z.string().min(1, { message: "Password is required" }),
});
export default function Callback({
  className,
  realCsrf,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    let csrf = localStorage.getItem("CSRF");
    async function handleCallback() {
      window.location.href = `${process.env.NEXT_PUBLIC_URI}/authorize${window.location.search}&csrf=${csrf}`;
    }
    handleCallback();
  }, []);
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 0.5,
      }}
    >
      <div className={cn("flex flex-col gap-6 ", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <Spinner className="bg-white mx-auto size-12" loading={true} />
            <CardDescription></CardDescription>
          </CardHeader>
        </Card>
        <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
          Powered by <Link href="https://hyeararat.com">Hye Urartu</Link>{" "}
        </div>
      </div>
    </motion.div>
  );
}
