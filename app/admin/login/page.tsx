import { LoginForm } from "@/components/login-form"
import { getBrandLogoUrl } from "@/lib/brand-settings"

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [{ error }, logoUrl] = await Promise.all([searchParams, getBrandLogoUrl()])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2 self-center font-medium">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size brand mark, not worth Image's overhead here
            <img src={logoUrl} alt="Fonder" className="size-6 rounded-md object-cover" />
          ) : (
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-xs font-semibold">F</span>
            </div>
          )}
          Fonder
        </div>
        <LoginForm hasError={Boolean(error)} />
      </div>
    </div>
  )
}
