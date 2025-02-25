import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  function randomIntFromInterval(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  const authWallpaper = `/images/login/login${randomIntFromInterval(
    1,
    10
  )}.jpg`;
  return (
    <>
      <html lang="en" suppressHydrationWarning={true}>
        <body
          className={cn(
            "font-sans antialiased",
            GeistMono.variable,
            GeistSans.variable
          )}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <div
              className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
              style={{
                backgroundImage: `url(${authWallpaper})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="flex w-full max-w-sm flex-col gap-6">
                {children}
              </div>
            </div>
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
