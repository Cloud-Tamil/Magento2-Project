import React, { useState } from 'react';
import { Copy, Check, Download, ShieldCheck, Key, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';

export const EnvConfigurator: React.FC = () => {
  const [config, setConfig] = useState({
    projectName: 'mageforge',
    appEnv: 'development',
    magentoMode: 'developer',
    baseUrl: 'http://localhost/',
    secureBaseUrl: 'https://localhost/',
    varnishPort: '80',
    nginxPort: '8080',
    magentoVersion: '2.4.7',
    magentoEdition: 'project-community-edition',
    composerUser: '',
    composerPassword: '',
    adminFirstName: 'Store',
    adminLastName: 'Administrator',
    adminEmail: 'admin@example.com',
    adminUsername: 'admin',
    adminPassword: 'Admin12345Password!',
    adminFrontname: 'admin_secure',
    mysqlDatabase: 'magento',
    mysqlUser: 'magento',
    mysqlPassword: 'magento_secret_pw',
    mysqlRootPassword: 'root_secret_pw',
    mysqlPort: '3306',
    opensearchHost: 'opensearch',
    opensearchPort: '9200',
    redisCacheHost: 'redis-cache',
    redisSessionHost: 'redis-session',
    rabbitmqUser: 'magento',
    rabbitmqPassword: 'rabbit_secret_pw',
    hostUid: '1000',
    hostGid: '1000',
  });

  const [copied, setCopied] = useState(false);

  const generateEnvContent = () => {
    return `# ==============================================================================
# MageForge: Magento 2 Docker Environment Configuration
# Generated via MageForge Configurator
# ==============================================================================

# Project Name & Environment
COMPOSE_PROJECT_NAME=${config.projectName}
APP_ENV=${config.appEnv}
MAGENTO_MODE=${config.magentoMode}

# Domain & Web Access
BASE_URL=${config.baseUrl}
SECURE_BASE_URL=${config.secureBaseUrl}
VARNISH_PORT=${config.varnishPort}
NGINX_PORT=${config.nginxPort}
RABBITMQ_MANAGEMENT_PORT=15672
MAILPIT_PORT=8025

# Magento Marketplace Authentication (repo.magento.com)
COMPOSER_MAGENTO_USERNAME=${config.composerUser || 'your_public_key_here'}
COMPOSER_MAGENTO_PASSWORD=${config.composerPassword || 'your_private_key_here'}

# Magento Version & Edition
MAGENTO_VERSION=${config.magentoVersion}
MAGENTO_EDITION=${config.magentoEdition}

# Magento Admin Credentials
ADMIN_FIRSTNAME=${config.adminFirstName}
ADMIN_LASTNAME=${config.adminLastName}
ADMIN_EMAIL=${config.adminEmail}
ADMIN_USERNAME=${config.adminUsername}
ADMIN_PASSWORD=${config.adminPassword}
ADMIN_FRONTNAME=${config.adminFrontname}

# Database Configuration (MySQL 8.0)
MYSQL_HOST=mysql
MYSQL_PORT=${config.mysqlPort}
MYSQL_DATABASE=${config.mysqlDatabase}
MYSQL_USER=${config.mysqlUser}
MYSQL_PASSWORD=${config.mysqlPassword}
MYSQL_ROOT_PASSWORD=${config.mysqlRootPassword}

# Search Engine Configuration (OpenSearch 2.x)
SEARCH_ENGINE=opensearch
OPENSEARCH_HOST=${config.opensearchHost}
OPENSEARCH_PORT=${config.opensearchPort}
OPENSEARCH_INDEX_PREFIX=magento2
OPENSEARCH_ENABLE_AUTH=0
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin

# Redis Configuration (Split Cache & Session)
REDIS_CACHE_HOST=${config.redisCacheHost}
REDIS_CACHE_PORT=6379
REDIS_CACHE_DB=0
REDIS_PAGE_CACHE_HOST=${config.redisCacheHost}
REDIS_PAGE_CACHE_PORT=6379
REDIS_PAGE_CACHE_DB=1

REDIS_SESSION_HOST=${config.redisSessionHost}
REDIS_SESSION_PORT=6379
REDIS_SESSION_DB=2

# RabbitMQ Message Broker
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=${config.rabbitmqUser}
RABBITMQ_PASSWORD=${config.rabbitmqPassword}
RABBITMQ_VHOST=/

# Host System IDs
HOST_UID=${config.hostUid}
HOST_GID=${config.hostGid}
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateEnvContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generateEnvContent()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '.env';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              Tailored .env Configuration Generator
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Configure Adobe credentials, deployment modes, admin credentials, and database settings for your automated Magento 2 container stack.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="download-custom-env-btn"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download .env</span>
            </button>
            <button
              id="copy-custom-env-btn"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied .env!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy .env Content</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* Marketplace Credentials Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-amber-900">
                <p className="font-semibold">Adobe Marketplace Authentication Keys</p>
                <p className="text-stone-700">
                  Magento 2 packages require free API keys to pull from <code>repo.magento.com</code> without manual prompts.
                </p>
                <a
                  href="https://marketplace.magento.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold underline mt-1"
                >
                  Generate free keys at marketplace.magento.com
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-amber-200/60">
              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">
                  Public Key (Username)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 52402ffb..."
                  value={config.composerUser}
                  onChange={(e) => setConfig({ ...config, composerUser: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">
                  Private Key (Password)
                </label>
                <input
                  type="password"
                  placeholder="e.g. 81a0397c..."
                  value={config.composerPassword}
                  onChange={(e) => setConfig({ ...config, composerPassword: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section: General Store Settings */}
          <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Application & Access Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Magento Version</label>
                <select
                  value={config.magentoVersion}
                  onChange={(e) => setConfig({ ...config, magentoVersion: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="2.4.7">2.4.7 (Latest Stable)</option>
                  <option value="2.4.6-p5">2.4.6-p5 (Security Release)</option>
                  <option value="2.4.5-p8">2.4.5-p8</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Deployment Mode</label>
                <select
                  value={config.magentoMode}
                  onChange={(e) => setConfig({ ...config, magentoMode: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="developer">developer (Debug & Symlinks)</option>
                  <option value="production">production (Strict & Fast)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-700 mb-1">Store Base URL</label>
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section: Admin User */}
          <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Admin Panel Credentials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Admin Username</label>
                <input
                  type="text"
                  value={config.adminUsername}
                  onChange={(e) => setConfig({ ...config, adminUsername: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Admin Password</label>
                <input
                  type="text"
                  value={config.adminPassword}
                  onChange={(e) => setConfig({ ...config, adminPassword: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Admin Email</label>
                <input
                  type="email"
                  value={config.adminEmail}
                  onChange={(e) => setConfig({ ...config, adminEmail: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Admin URI Frontname</label>
                <input
                  type="text"
                  value={config.adminFrontname}
                  onChange={(e) => setConfig({ ...config, adminFrontname: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section: Database Credentials */}
          <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              MySQL 8.0 Database
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Database Name</label>
                <input
                  type="text"
                  value={config.mysqlDatabase}
                  onChange={(e) => setConfig({ ...config, mysqlDatabase: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Database User</label>
                <input
                  type="text"
                  value={config.mysqlUser}
                  onChange={(e) => setConfig({ ...config, mysqlUser: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">User Password</label>
                <input
                  type="text"
                  value={config.mysqlPassword}
                  onChange={(e) => setConfig({ ...config, mysqlPassword: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="bg-stone-900 rounded-xl border border-stone-800 p-4 flex-1 flex flex-col shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                <span className="font-mono text-stone-400 ml-2">.env (Live Output)</span>
              </div>
              <span className="text-[11px] text-stone-500 font-mono">UTF-8</span>
            </div>
            <pre className="flex-1 overflow-auto text-stone-200 font-mono text-[11.5px] p-3 leading-relaxed select-all">
              {generateEnvContent()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
