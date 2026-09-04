export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { BootstrapService } = await import("@/services/bootstrap/bootstrap.service");
      await BootstrapService.ensureDefaults();
    } catch {
      // Safe fallback for startup initialization
    }
  }
}
