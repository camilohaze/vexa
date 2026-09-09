import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

export interface TelemetryOptions {
  serviceName: string;
  otlpEndpoint?: string;
  prometheusPort?: number;
}

export function startTelemetry(options: TelemetryOptions): NodeSDK | undefined {
  const serviceName = process.env['OTEL_SERVICE_NAME'] ?? options.serviceName;
  const otlpEndpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ?? options.otlpEndpoint;
  if (!otlpEndpoint) return undefined;

  const prometheusPort = Number(process.env['OTEL_PROMETHEUS_PORT'] ?? options.prometheusPort ?? 0);

  const sdk = new NodeSDK({
    serviceName,
    traceExporter: new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` }),
    metricReader: prometheusPort ? new PrometheusExporter({ port: prometheusPort }) : undefined,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();
  const shutdown = () => sdk.shutdown().finally(() => process.exit(0));
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  return sdk;
}
