import React, { useState } from 'react';
import { BookOpen, ExternalLink, HelpCircle, AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';

export const DocumentationTab: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Intro Hero */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-amber-100 text-amber-800">
            <BookOpen className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              MageForge Complete Architecture & Operational Guide
            </h2>
            <p className="text-xs text-stone-500 font-mono">
              Targeting Adobe Magento 2.4.7 • PHP 8.2 • OpenSearch 2.12 • Redis 7.2 • RabbitMQ 3.12
            </p>
          </div>
        </div>
        <p className="text-sm text-stone-700 leading-relaxed">
          MageForge is a containerized orchestration platform designed to provision, configure, and install Magento 2 without manual CLI intervention. The setup handles everything: dependency polling, database creation, Redis split setup, OpenSearch cluster initialization, crontab management, DI compilation, and static asset generation.
        </p>
      </div>

      {/* Quick Launch Checklist */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          End-to-End Setup Checklist (From Scratch)
        </h3>

        <div className="space-y-3 text-xs text-stone-700">
          <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900">1. Clone Repository & Prepare Workspace</span>
            <p className="text-stone-600">Ensure Docker and Docker Compose v2 are installed on your host machine.</p>
            <div className="p-2 bg-stone-900 text-stone-100 font-mono rounded mt-2 flex items-center justify-between">
              <span>git clone &lt;repo-url&gt; magento2-project && cd magento2-project</span>
              <button
                onClick={() => copySnippet('clone', 'git clone <repo-url> magento2-project && cd magento2-project')}
                className="text-stone-400 hover:text-white cursor-pointer ml-2"
              >
                {copiedKey === 'clone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900">2. Configure Adobe Marketplace Keys in .env</span>
            <p className="text-stone-600">
              Copy <code>.env.example</code> to <code>.env</code> and fill in your free Adobe Marketplace keys:
            </p>
            <div className="p-2 bg-stone-900 text-stone-100 font-mono rounded mt-2 flex items-center justify-between">
              <span>cp .env.example .env</span>
              <button
                onClick={() => copySnippet('env', 'cp .env.example .env')}
                className="text-stone-400 hover:text-white cursor-pointer ml-2"
              >
                {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900">3. Boot the Automated Stack</span>
            <p className="text-stone-600">
              Run the compose command. The automated installer will wait for MySQL, OpenSearch, and RabbitMQ, then install Magento 2:
            </p>
            <div className="p-2 bg-stone-900 text-stone-100 font-mono rounded mt-2 flex items-center justify-between">
              <span>docker compose up -d --build</span>
              <button
                onClick={() => copySnippet('up', 'docker compose up -d --build')}
                className="text-stone-400 hover:text-white cursor-pointer ml-2"
              >
                {copiedKey === 'up' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900">4. Tail Installation Progress</span>
            <p className="text-stone-600">
              Observe the real-time installation logs:
            </p>
            <div className="p-2 bg-stone-900 text-stone-100 font-mono rounded mt-2 flex items-center justify-between">
              <span>docker compose logs -f php-cli</span>
              <button
                onClick={() => copySnippet('logs', 'docker compose logs -f php-cli')}
                className="text-stone-400 hover:text-white cursor-pointer ml-2"
              >
                {copiedKey === 'logs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Access Endpoints Table */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
          Default Service Endpoints & Credentials
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-700">
            <thead className="bg-stone-100 text-stone-900 uppercase font-semibold">
              <tr>
                <th className="p-2.5">Service</th>
                <th className="p-2.5">Endpoint URL</th>
                <th className="p-2.5">Default Credentials</th>
                <th className="p-2.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              <tr>
                <td className="p-2.5 font-bold">Storefront (Varnish)</td>
                <td className="p-2.5 font-mono text-amber-700">http://localhost/</td>
                <td className="p-2.5">None (Public)</td>
                <td className="p-2.5">High-speed cached customer catalog</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">Magento Admin Panel</td>
                <td className="p-2.5 font-mono text-amber-700">http://localhost/admin_secure</td>
                <td className="p-2.5 font-mono">admin / Admin12345Password!</td>
                <td className="p-2.5">Store management & catalog backoffice</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">OpenSearch Engine</td>
                <td className="p-2.5 font-mono">http://localhost:9200</td>
                <td className="p-2.5">None (Internal Bridge)</td>
                <td className="p-2.5">Catalog search cluster REST API</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">RabbitMQ Management</td>
                <td className="p-2.5 font-mono">http://localhost:15672</td>
                <td className="p-2.5 font-mono">magento / rabbit_secret_pw</td>
                <td className="p-2.5">AMQP queue inspector & statistics</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">Mailpit Web Interface</td>
                <td className="p-2.5 font-mono">http://localhost:8025</td>
                <td className="p-2.5">None</td>
                <td className="p-2.5">Local SMTP inbox for order confirmations</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Troubleshooting Section */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-600" />
          Frequently Encountered Issues & Instant Fixes
        </h3>

        <div className="space-y-4 text-xs">
          <div className="border-l-2 border-amber-500 pl-3 space-y-1">
            <strong className="text-stone-900 block font-semibold">
              Issue 1: OpenSearch reports 'max virtual memory areas vm.max_map_count is too low'
            </strong>
            <p className="text-stone-600">
              Linux kernel memory allocation for Java Lucene indices is constrained by default on Linux host systems.
            </p>
            <div className="p-2 bg-stone-900 text-stone-100 font-mono rounded mt-1">
              sudo sysctl -w vm.max_map_count=262144
            </div>
          </div>

          <div className="border-l-2 border-amber-500 pl-3 space-y-1">
            <strong className="text-stone-900 block font-semibold">
              Issue 2: Composer 401 Unauthorized Error on repo.magento.com
            </strong>
            <p className="text-stone-600">
              Adobe requires free access keys to pull Magento 2. Generate a key pair under your Adobe account at{' '}
              <a href="https://marketplace.magento.com/" target="_blank" rel="noreferrer" className="underline text-amber-700">
                marketplace.magento.com
              </a>{' '}
              and assign them to <code>COMPOSER_MAGENTO_USERNAME</code> and <code>COMPOSER_MAGENTO_PASSWORD</code> in your <code>.env</code>.
            </p>
          </div>

          <div className="border-l-2 border-amber-500 pl-3 space-y-1">
            <strong className="text-stone-900 block font-semibold">
              Issue 3: Permission Denied inside var/ or pub/static/
            </strong>
            <p className="text-stone-600">
              Run MageForge's built-in permission normalizer to align Linux UID/GID modes:
            </p>
            <div className="p-2 bg-stone-900 text-stone-100 font-mono rounded mt-1">
              make permissions
            </div>
          </div>

          <div className="border-l-2 border-amber-500 pl-3 space-y-1">
            <strong className="text-stone-900 block font-semibold">
              Issue 4: How to perform a complete clean reset
            </strong>
            <p className="text-stone-600">
              Erase all database volumes, cached files, and marker flags to begin completely clean:
            </p>
            <div className="p-2 bg-stone-900 text-stone-100 font-mono rounded mt-1">
              make reset
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
