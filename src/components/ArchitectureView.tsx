import React, { useState } from 'react';
import {
  Zap,
  Server,
  Cpu,
  Database,
  Layers,
  Shield,
  Search,
  Radio,
  Clock,
  Terminal,
  ArrowRight,
  Info,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { SERVICE_NODES } from '../data/projectData';
import { ServiceNode } from '../types';

export const ArchitectureView: React.FC = () => {
  const [selectedService, setSelectedService] = useState<ServiceNode>(SERVICE_NODES[0]);

  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'varnish':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'nginx':
        return <Server className="w-5 h-5 text-teal-500" />;
      case 'php-fpm':
        return <Cpu className="w-5 h-5 text-indigo-500" />;
      case 'php-cli':
        return <Terminal className="w-5 h-5 text-emerald-500" />;
      case 'php-cron':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'mysql':
        return <Database className="w-5 h-5 text-sky-500" />;
      case 'redis-cache':
        return <Layers className="w-5 h-5 text-rose-500" />;
      case 'redis-session':
        return <Shield className="w-5 h-5 text-red-500" />;
      case 'opensearch':
        return <Search className="w-5 h-5 text-teal-400" />;
      case 'rabbitmq':
        return <Radio className="w-5 h-5 text-orange-500" />;
      default:
        return <Server className="w-5 h-5 text-stone-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Topology Header */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-2xs">
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">
          Microservices Architecture & Request Pipeline
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          Click on any service component in the topology to inspect its Docker image, configuration file, internal ports, and healthcheck probe.
        </p>
      </div>

      {/* Interactive Visual Map */}
      <div className="bg-stone-900 rounded-2xl p-6 sm:p-8 text-stone-100 shadow-lg border border-stone-800">
        <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          End-to-End Traffic Pipeline
        </div>

        {/* Pipeline Diagram */}
        <div className="space-y-6">
          {/* Level 1: Client Traffic -> Varnish */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="px-4 py-2.5 rounded-lg bg-stone-800 border border-stone-700 text-xs font-mono text-stone-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Client Web Browser
            </div>
            <ArrowRight className="w-4 h-4 text-stone-500 rotate-90 md:rotate-0" />
            
            {/* Varnish Node */}
            <button
              id="arch-node-varnish"
              onClick={() => setSelectedService(SERVICE_NODES.find((s) => s.id === 'varnish')!)}
              className={`p-4 rounded-xl border transition-all cursor-pointer text-left w-full md:w-64 ${
                selectedService.id === 'varnish'
                  ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                  : 'bg-stone-800/80 border-stone-700 hover:border-stone-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Varnish Cache 7.4
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300">
                  :80 (FPC)
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Sub-15ms cached page responses & purge tags
              </p>
            </button>
          </div>

          {/* Level 2: Varnish -> Nginx */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="text-[10px] font-mono text-stone-500 italic">Cache Miss / Pass</div>
            <ArrowRight className="w-4 h-4 text-stone-500 rotate-90 md:rotate-0" />

            {/* Nginx Node */}
            <button
              id="arch-node-nginx"
              onClick={() => setSelectedService(SERVICE_NODES.find((s) => s.id === 'nginx')!)}
              className={`p-4 rounded-xl border transition-all cursor-pointer text-left w-full md:w-64 ${
                selectedService.id === 'nginx'
                  ? 'bg-teal-950/50 border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                  : 'bg-stone-800/80 border-stone-700 hover:border-stone-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <Server className="w-4 h-4 text-teal-400" />
                  Nginx 1.25 Alpine
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-900/60 text-teal-300">
                  :8080
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Static asset delivery & FastCGI proxying
              </p>
            </button>
          </div>

          {/* Level 3: Nginx -> PHP-FPM */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="text-[10px] font-mono text-stone-500 italic">FastCGI pass</div>
            <ArrowRight className="w-4 h-4 text-stone-500 rotate-90 md:rotate-0" />

            {/* PHP-FPM Node */}
            <button
              id="arch-node-php-fpm"
              onClick={() => setSelectedService(SERVICE_NODES.find((s) => s.id === 'php-fpm')!)}
              className={`p-4 rounded-xl border transition-all cursor-pointer text-left w-full md:w-80 ${
                selectedService.id === 'php-fpm'
                  ? 'bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'bg-stone-800/80 border-stone-700 hover:border-stone-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  PHP 8.2-FPM Engine
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300">
                  :9000
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Magento 2 application core & business logic
              </p>
            </button>
          </div>

          {/* Level 4: Backend Infrastructure Grid */}
          <div className="pt-4 border-t border-stone-800">
            <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3 text-center">
              Backend Storage, Search & Queue Infrastructure
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { id: 'mysql', title: 'MySQL 8.0', port: ':3306', desc: 'Relational DB' },
                { id: 'redis-cache', title: 'Redis Cache', port: ':6379', desc: 'Volatile-LRU' },
                { id: 'redis-session', title: 'Redis Session', port: ':6379 (int)', desc: 'Noeviction' },
                { id: 'opensearch', title: 'OpenSearch 2.12', port: ':9200', desc: 'Catalog Search' },
                { id: 'rabbitmq', title: 'RabbitMQ 3.12', port: ':5672/:15672', desc: 'AMQP Broker' },
              ].map((item) => {
                const isSel = selectedService.id === item.id;
                return (
                  <button
                    key={item.id}
                    id={`arch-node-${item.id}`}
                    onClick={() => setSelectedService(SERVICE_NODES.find((s) => s.id === item.id)!)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSel
                        ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
                        : 'bg-stone-800/60 border-stone-700/80 hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {getServiceIcon(item.id)}
                      <span className="font-semibold text-xs text-stone-100">{item.title}</span>
                    </div>
                    <div className="text-[10px] font-mono text-amber-400 mt-1">{item.port}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Level 5: Background Daemons */}
          <div className="pt-3 border-t border-stone-800/60 flex flex-wrap items-center justify-center gap-4">
            <span className="text-[11px] text-stone-400 font-medium">Background Daemons:</span>
            {['php-cron', 'php-cli'].map((id) => {
              const s = SERVICE_NODES.find((x) => x.id === id)!;
              const isSel = selectedService.id === id;
              return (
                <button
                  key={id}
                  id={`arch-node-${id}`}
                  onClick={() => setSelectedService(s)}
                  className={`px-3 py-1.5 rounded-md border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                    isSel
                      ? 'bg-amber-900/40 border-amber-500 text-amber-200'
                      : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
                  }`}
                >
                  {getServiceIcon(id)}
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Inspector Card */}
      {selectedService && (
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-stone-100 border border-stone-200">
                {getServiceIcon(selectedService.id)}
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">{selectedService.name}</h3>
                <span className="text-xs font-mono text-stone-500">
                  container_name: {selectedService.containerName}
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
              {selectedService.role}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-xs">
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 space-y-1">
              <span className="font-semibold text-stone-700">Docker Image</span>
              <p className="font-mono text-stone-900">{selectedService.image}</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 space-y-1">
              <span className="font-semibold text-stone-700">Exposed Port(s)</span>
              <p className="font-mono text-stone-900">{selectedService.ports.join(', ')}</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 space-y-1">
              <span className="font-semibold text-stone-700">Primary Config File</span>
              <p className="font-mono text-amber-800 font-medium">{selectedService.configFile}</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 space-y-1">
              <span className="font-semibold text-stone-700">Health Check Probe</span>
              <p className="font-mono text-stone-900">{selectedService.healthcheck}</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50/50 rounded-lg border border-amber-100 text-xs text-stone-700">
            <strong className="text-amber-900">Functional Role: </strong>
            {selectedService.purpose}
          </div>
        </div>
      )}
    </div>
  );
};
