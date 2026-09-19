import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Terminal,
  Server,
  Database,
  Search,
  ShieldCheck,
  Copy,
  Check,
  Download,
  Play,
  Flame,
  Layers,
  ArrowRight,
  ExternalLink,
  Cpu,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface WorkloadPreset {
  id: string;
  name: string;
  category: 'smoke' | 'cache' | 'search' | 'session' | 'stress' | 'fixtures';
  description: string;
  targetService: string;
  command: string;
  dockerCommand?: string;
  expectedOutcome: string;
  latencyTarget: string;
}

export const WorkloadTestingTab: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('varnish-benchmark');
  const [targetUrl, setTargetUrl] = useState<string>('http://localhost');
  const [requestCount, setRequestCount] = useState<number>(100);
  const [concurrency, setConcurrency] = useState<number>(10);

  const presets: WorkloadPreset[] = [
    {
      id: 'quick-smoke',
      name: 'Pre-flight Health & Ping Check',
      category: 'smoke',
      description: 'Performs rapid HTTP status & latency validation across Varnish (Port 80) and Nginx (Port 8080).',
      targetService: 'Varnish & Nginx',
      command: `curl -s -o /dev/null -w "Varnish (Port 80): HTTP %{http_code} in %{time_total}s\\n" ${targetUrl}/ && curl -s -o /dev/null -w "Direct Nginx (Port 8080): HTTP %{http_code} in %{time_total}s\\n" ${targetUrl}:8080/`,
      expectedOutcome: 'HTTP 200 or 302 with Varnish responding faster than direct PHP-FPM.',
      latencyTarget: '< 50ms (Varnish)'
    },
    {
      id: 'varnish-benchmark',
      name: 'Varnish Cache Hit vs Miss Benchmark',
      category: 'cache',
      description: 'Warms the homepage cache and dispatches 10 sequential requests to measure sub-15ms cached latency.',
      targetService: 'Varnish 7.4 FPC',
      command: `for i in {1..10}; do curl -s -o /dev/null -w "Req $i: HTTP %{http_code} in %{time_total}s\\n" ${targetUrl}/; done`,
      expectedOutcome: 'Sub-15ms response times on requests 2-10 with X-Magento-Cache-Debug: HIT.',
      latencyTarget: 'sub-15ms (100x speedup)'
    },
    {
      id: 'search-spike',
      name: 'OpenSearch Catalog Search Spike',
      category: 'search',
      description: 'Dispatches simulated multi-term catalog search queries to test OpenSearch indexing and facet queries.',
      targetService: 'OpenSearch 2.12',
      command: `for term in shirt bag watch shoes jacket; do curl -s -o /dev/null -w "Query [?q=$term]: HTTP %{http_code} in %{time_total}s\\n" "${targetUrl}/catalogsearch/result/?q=$term"; done`,
      dockerCommand: `docker compose exec php-cli curl -s "http://opensearch:9200/_cat/indices?v"`,
      expectedOutcome: 'OpenSearch queries return cleanly with no index dropouts or memory exhaustion.',
      latencyTarget: '< 250ms'
    },
    {
      id: 'session-simulation',
      name: 'Multi-User Shopping Journey Simulation',
      category: 'session',
      description: 'Spawns concurrent customer shopping journeys with isolated cookies, testing Redis session clustering.',
      targetService: 'Redis Session Store',
      command: `for i in {1..${concurrency}}; do (curl -s -c /tmp/c_$i.txt "${targetUrl}/" >/dev/null && curl -s -b /tmp/c_$i.txt -c /tmp/c_$i.txt "${targetUrl}/catalogsearch/result/?q=shirt" >/dev/null && rm -f /tmp/c_$i.txt) & done; wait`,
      dockerCommand: `docker compose exec redis-session redis-cli dbsize`,
      expectedOutcome: 'Active customer sessions safely persist in Redis DB 2 without volatile eviction.',
      latencyTarget: 'Concurrent sessions safely tracked'
    },
    {
      id: 'high-concurrency-ab',
      name: 'High-Concurrency Load Burst (ab)',
      category: 'stress',
      description: 'Simulates high-traffic flash sale spikes using Apache Benchmark with keep-alive connections.',
      targetService: 'Varnish & Web Gateway',
      command: `ab -n ${requestCount} -c ${concurrency} -k ${targetUrl}/`,
      expectedOutcome: 'Sustained 1,500+ requests per second through Varnish with zero connection drops.',
      latencyTarget: '1,500+ req/sec'
    },
    {
      id: 'native-fixtures',
      name: 'Magento 2 Native Performance Fixtures',
      category: 'fixtures',
      description: 'Generates 800 products, 30 categories, and 20 customers using Magento 2 built-in performance toolkit.',
      targetService: 'MySQL, OpenSearch, PHP-CLI',
      command: `docker compose exec -u magento php-cli bin/magento setup:perf:generate-fixtures /var/www/html/setup/performance-toolkit/profiles/ce/small.xml && docker compose exec -u magento php-cli bin/magento indexer:reindex && docker compose exec -u magento php-cli bin/magento cache:flush`,
      dockerCommand: `docker compose exec -u magento php-cli bin/magento indexer:status`,
      expectedOutcome: 'Catalog is populated with hundreds of products and ready for realistic search benchmarking.',
      latencyTarget: '~2 minutes setup time'
    }
  ];

  const activePreset = presets.find((p) => p.id === selectedPresetId) || presets[0];

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadScript = () => {
    const scriptContent = `#!/usr/bin/env bash
# MageForge: Automated Temporary Workload & Performance Testing Suite
set -euo pipefail

BASE_URL="${targetUrl}"
TOTAL_REQUESTS="${requestCount}"
CONCURRENCY="${concurrency}"

echo "=================================================================="
echo " Starting Workload Test against $BASE_URL"
echo " Requests: $TOTAL_REQUESTS | Concurrency: $CONCURRENCY"
echo "=================================================================="

# 1. Warmup
echo "Phase 1: Warming Varnish Cache..."
curl -s -o /dev/null "$BASE_URL/" || true

# 2. Varnish Cache Hit Test
echo "Phase 2: Measuring 10 cached requests..."
for i in {1..10}; do
  curl -s -o /dev/null -w "  Request $i: %{time_total}s (HTTP %{http_code})\\n" "$BASE_URL/"
done

# 3. Catalog Search Spike
echo "Phase 3: Catalog Search Spike across OpenSearch..."
for term in shirt watch bag shoes jacket; do
  curl -s -o /dev/null -w "  Search [?q=$term]: %{time_total}s\\n" "$BASE_URL/catalogsearch/result/?q=$term"
done

# 4. Multi-user concurrent sessions
echo "Phase 4: Simulating $CONCURRENCY concurrent visitors..."
for i in $(seq 1 "$CONCURRENCY"); do
  COOKIE_FILE=$(mktemp)
  (
    curl -s -c "$COOKIE_FILE" -o /dev/null "$BASE_URL/"
    curl -s -b "$COOKIE_FILE" -c "$COOKIE_FILE" -o /dev/null "$BASE_URL/catalogsearch/result/?q=shirt"
    rm -f "$COOKIE_FILE"
  ) &
done
wait

echo "=================================================================="
echo " Workload completed successfully!"
echo "=================================================================="
`;
    const blob = new Blob([scriptContent], { type: 'text/x-shellscript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'test-workload.sh';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Hero Banner */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4" />
              Application Testing & Workload Suite
            </div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              Temporary Workload Generator & Microservice Stress Testing
            </h2>
            <p className="text-sm text-stone-600 mt-1 max-w-3xl">
              Execute realistic synthetic workloads against your local Magento 2 stack to verify Varnish sub-15ms caching, stress OpenSearch search clusters, simulate concurrent customer carts, and benchmark overall throughput.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="download-workload-script-btn"
              onClick={handleDownloadScript}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download test-workload.sh</span>
            </button>
            <button
              id="copy-full-script-btn"
              onClick={() =>
                handleCopy('run-workload', `./docker/scripts/test-workload.sh`)
              }
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-colors cursor-pointer"
            >
              {copiedKey === 'run-workload' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Run Command!</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                  <span>Run Script Command</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preset Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {presets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              id={`preset-btn-${preset.id}`}
              onClick={() => setSelectedPresetId(preset.id)}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                      isSelected
                        ? 'bg-amber-200/80 text-amber-950'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {preset.category}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 font-mono">
                    {preset.latencyTarget}
                  </span>
                </div>
                <h4
                  className={`text-xs font-bold leading-snug ${
                    isSelected ? 'text-amber-950' : 'text-stone-900'
                  }`}
                >
                  {preset.name}
                </h4>
                <p className="text-[11px] text-stone-600 mt-1 line-clamp-2">
                  {preset.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                <span className="text-stone-500 font-medium">Target: {preset.targetService}</span>
                <span className={`font-semibold ${isSelected ? 'text-amber-700' : 'text-stone-400'}`}>
                  Select →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Workload Configuration & Interactive Command Runner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Workload Customizer */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              Workload Parameters
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Target Endpoint URL</label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg font-mono text-stone-900 text-xs focus:ring-2 focus:ring-amber-500"
                  placeholder="http://localhost"
                />
                <span className="text-[10px] text-stone-600 block mt-1 font-medium">
                  Use port 80 for Varnish (fast) or port 8080 for Direct Nginx (uncached)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Total Requests ({requestCount})
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={requestCount}
                    onChange={(e) => setRequestCount(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Concurrency Level ({concurrency})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={concurrency}
                    onChange={(e) => setConcurrency(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* Target Details Box */}
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-700">Target Microservice:</span>
                <span className="font-mono text-stone-900 font-semibold">{activePreset.targetService}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-700">Expected Outcome:</span>
                <span className="text-emerald-700 font-medium text-right text-[11px]">{activePreset.expectedOutcome}</span>
              </div>
            </div>
          </div>

          {/* Quick Launch Workload Command Card */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs space-y-2 text-amber-950">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Flame className="w-4 h-4 text-amber-600" />
              One-Shot Container Workload Execution
            </div>
            <p className="text-stone-700">
              You can trigger the comprehensive workload directly inside the container or from your local machine terminal:
            </p>
            <div className="p-2.5 bg-stone-900 text-stone-100 font-mono text-[11px] rounded-lg flex items-center justify-between">
              <span className="truncate text-emerald-400">
                docker compose exec php-cli bash /var/www/scripts/test-workload.sh
              </span>
              <button
                id="copy-container-workload-btn"
                onClick={() =>
                  handleCopy(
                    'exec-workload',
                    'docker compose exec php-cli bash /var/www/scripts/test-workload.sh'
                  )
                }
                className="ml-2 p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white shrink-0 cursor-pointer"
                title="Copy Command"
              >
                {copiedKey === 'exec-workload' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Terminal Preview & Inspection */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="bg-stone-900 rounded-xl border border-stone-800 p-4 text-stone-100 shadow-md flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="font-mono text-stone-400 ml-2">Active Workload Terminal Command</span>
                </div>
                <button
                  id="copy-preset-cmd-btn"
                  onClick={() => handleCopy('preset-cmd', activePreset.command)}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  {copiedKey === 'preset-cmd' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Command</span>
                    </>
                  )}
                </button>
              </div>

              {/* Terminal Code Block */}
              <div className="mt-3 p-3 bg-black/60 rounded-lg font-mono text-xs text-emerald-400 border border-stone-800 overflow-x-auto leading-relaxed select-all">
                $ {activePreset.command}
              </div>

              {activePreset.dockerCommand && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                    <span>Secondary Verification Command:</span>
                    <button
                      onClick={() => handleCopy('docker-cmd', activePreset.dockerCommand!)}
                      className="text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1"
                    >
                      {copiedKey === 'docker-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-black/40 rounded-md font-mono text-[11.5px] text-sky-300 border border-stone-800/80 overflow-x-auto select-all">
                    $ {activePreset.dockerCommand}
                  </div>
                </div>
              )}
            </div>

            {/* Diagnostic Advice */}
            <div className="mt-4 pt-3 border-t border-stone-800 text-xs text-stone-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Expected Behavior: </strong>
                {activePreset.expectedOutcome}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Microservice Diagnostic Commands Table */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-600" />
          Real-Time Microservice Observability during Workload Execution
        </h3>
        <p className="text-xs text-stone-600">
          Run these inspection commands in a separate terminal tab while executing your workload to monitor memory usage, queue lengths, and cluster states:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            {
              title: 'Live Container CPU & RAM',
              cmd: 'docker stats',
              desc: 'Displays real-time memory usage and CPU percent per container.',
            },
            {
              title: 'Redis Cache Hit/Miss Stats',
              cmd: 'docker compose exec redis-cache redis-cli info stats',
              desc: 'Check keyspace_hits vs keyspace_misses on cache node.',
            },
            {
              title: 'Redis Active Sessions Count',
              cmd: 'docker compose exec redis-session redis-cli dbsize',
              desc: 'Shows the exact number of active shopping sessions stored.',
            },
            {
              title: 'OpenSearch Cluster Health',
              cmd: 'curl -s http://localhost:9200/_cluster/health | jq .',
              desc: 'Confirms catalog search cluster health (yellow or green).',
            },
            {
              title: 'RabbitMQ Queue Inspection',
              cmd: 'docker compose exec rabbitmq rabbitmqctl list_queues',
              desc: 'Inspect background async consumer queue backlogs.',
            },
            {
              title: 'MySQL Connection Threads',
              cmd: 'docker compose exec mysql mysqladmin status -u magento -pmagento_secret_pw',
              desc: 'Monitors active database threads and queries per second.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between space-y-2"
            >
              <div>
                <span className="font-bold text-stone-900 text-xs block">{item.title}</span>
                <p className="text-[11px] text-stone-600 mt-0.5">{item.desc}</p>
              </div>
              <div className="p-2 bg-stone-900 text-stone-100 rounded-lg font-mono text-[11px] flex items-center justify-between">
                <span className="truncate text-amber-300">$ {item.cmd}</span>
                <button
                  onClick={() => handleCopy(`diag-${idx}`, item.cmd)}
                  className="ml-2 p-1 text-stone-400 hover:text-white cursor-pointer shrink-0"
                  title="Copy command"
                >
                  {copiedKey === `diag-${idx}` ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
