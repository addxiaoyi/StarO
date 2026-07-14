/**
 * OpenTelemetry instrumentation for Next.js
 *
 * Place in src/instrumentation.ts (Next.js 14+)
 * Only loads when OTEL_ENABLED=true or NODE_ENV=production
 */

export function register() {
  // Only enable in production or when explicitly configured
  if (process.env.OTEL_ENABLED !== "true" && process.env.NODE_ENV !== "production") {
    console.log("OpenTelemetry disabled - set OTEL_ENABLED=true to enable");
    return;
  }

  try {
    // Dynamic require for lazy loading
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sdk = require("@opentelemetry/sdk-node");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resource } = require("@opentelemetry/resources");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = require("@opentelemetry/semantic-conventions");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");

    const resource = new Resource({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "starx-oauth",
      [ATTR_SERVICE_VERSION]: process.env.npm_package_version || "1.0.0",
      "deployment.environment": process.env.NODE_ENV || "development",
    });

    const traceExporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces",
    });

    const openTelemetrySdk = new sdk.NodeSDK({
      resource,
      traceExporter,
      instrumentations: [new HttpInstrumentation()],
    });

    openTelemetrySdk.start();
    console.log("OpenTelemetry SDK started");

    process.on("SIGTERM", () => {
      openTelemetrySdk
        .shutdown()
        .then(() => console.log("OpenTelemetry SDK shut down"))
        .catch((error: Error) => console.error("Error shutting down OpenTelemetry", error))
        .finally(() => process.exit(0));
    });
  } catch (error) {
    console.error("Failed to initialize OpenTelemetry:", error);
  }
}
