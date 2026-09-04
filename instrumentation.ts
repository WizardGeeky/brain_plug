export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { BootstrapService } = await import("@/services/bootstrap/bootstrap.service");
    await BootstrapService.ensureDefaults();
  }
}
