"use client";

import { cn } from "@/lib/utils";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import React, { useEffect } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

import { motion } from "framer-motion";

export default function Callback({
  className,
  realCsrf,
  ...props
}: {
  className?: string;
  realCsrf: string;
} & React.HTMLAttributes<HTMLDivElement> & {
    csrf?: string;
    code?: string;
    state?: string;
    client_id?: string;
    redirect_uri?: string;
  }) {
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
