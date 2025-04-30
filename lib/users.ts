"use server";

import { Md5 } from "ts-md5";
import { prisma } from "./prisma";
import argon2 from "argon2";
import { getMessage } from "./mail";
import nodemailer from "nodemailer";

export async function resetPassword(
  csrfToken: string,
  {
    token,
    password,
    captcha,
  }: { token: string; password: string; captcha: string }
) {
  const cap = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: captcha,
    } as any),
  });
  let capData = await cap.json();
  if (!capData.success) return "Failed to verify humanity";

  const session = await prisma.passwordResetSession.findUnique({
    where: {
      id: token,
    },
  });
  if (!session) return "Invalid password reset token";
  const hashedPass = await argon2.hash(password);
  await prisma.user.update({
    where: {
      email: session.email,
    },
    data: {
      password: hashedPass,
    },
  });
  await prisma.passwordResetSession.delete({
    where: {
      id: token,
    },
  });
  return session.email;
}

export async function initiatePasswordReset(
  csrfToken: string,
  {
    email,
    captcha,
  }: {
    email: string;
    captcha: string;
  }
) {
  const cap = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: captcha,
    } as any),
  });
  let capData = await cap.json();
  if (!capData.success) return "Failed to verify humanity";
  let user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!user) return email;
  const resetSession = await prisma.passwordResetSession.create({
    data: {
      email: email,
    },
  });
  const message = getMessage(
    `${process.env.NEXT_PUBLIC_ACCOUNT_NAME} Password Reset Request | Hye Urartu`,
    email,
    [
      `You recently requested to reset the password for your ${process.env.NEXT_PUBLIC_ACCOUNT_NAME}.`,
      "To reset your password, click the link below.",
    ],
    {
      url: `${process.env.NEXT_PUBLIC_URI}/reset-password?token=${resetSession.id}`,
      text: `${process.env.NEXT_PUBLIC_ACCOUNT_NAME} Password Reset`,
    },
    [
      "If you did not request reset your password, please ignore this email. No further action is required.",
    ]
  );
  console.log(process.env.SMTP_USER);
  const mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT as string),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  await mailer.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `${process.env.NEXT_PUBLIC_ACCOUNT_NAME} Password Reset Request | Hye Urartu`,
    text: `Here is the link you requested to reset your ${process.env.NEXT_PUBLIC_ACCOUNT_NAME} password.`,
    html: message,
  });
  return email;
}

export async function initiateSignUp(
  csrfToken: string,
  {
    captcha,
    email,
  }: {
    captcha: string;
    email: string;
  }
) {
  const cap = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: captcha,
    } as any),
  });
  let capData = await cap.json();
  if (!capData.success) return "Failed to verify humanity";
  let user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!user) return email;
  const session = await prisma.signupSession.create({
    data: {
      email: email,
    },
  });
  const message = getMessage(
    `Create your ${process.env.NEXT_PUBLIC_ACCOUNT_NAME}`,
    email,
    [
      `To continue creating your ${process.env.NEXT_PUBLIC_ACCOUNT_NAME}, click the link below.`,
    ],
    {
      url: `${process.env.NEXT_PUBLIC_URI}/sign-up?token=${session.id}`,
      text: `Create ${process.env.NEXT_PUBLIC_ACCOUNT_NAME}`,
    },
    [
      "If you did not request to create a new account, please ignore this email. No further action is required.",
    ]
  );
  console.log(process.env.SMTP_USER);
  const mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT as string),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  await mailer.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Create your ${process.env.NEXT_PUBLIC_ACCOUNT_NAME} | Hye Urartu`,
    text: `Here is the link you requested to create your ${process.env.NEXT_PUBLIC_ACCOUNT_NAME}.`,
    html: message,
  });
  return email;
}

export async function createUser(
  csrfToken: string,
  registrationToken: string,
  {
    email,
    password,
    firstName,
    lastName,
    captcha,
  }: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    captcha: string;
  }
) {
  //console.log(csrfToken, email, password, captcha);
  const cap = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: captcha,
    } as any),
  });
  let capData = await cap.json();
  if (!capData.success) return "Failed to verify humanity";
  const session = await prisma.signupSession.findUnique({
    where: {
      id: registrationToken,
    },
  });
  if (!session) return "Invalid registration token";
  if (session.email !== email)
    return "This is not the email you signed up with";
  const hashedPass = await argon2.hash(password);
  try {
  } catch (error) {}
  let user = await prisma.user.create({
    data: {
      email: session.email,
      password: hashedPass,
      authMethod: "urartu",
      firstName,
      lastName,
      avatar: `https://www.gravatar.com/avatar/${Md5.hashStr(
        email
      )}?d=https://www.hyeararat.com/img/logo-square.png`,
    },
  });
  await prisma.signupSession.delete({
    where: {
      id: registrationToken,
    },
  });
  return {
    ...user,
    password: undefined,
  };
}
