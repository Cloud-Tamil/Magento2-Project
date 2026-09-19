import React, { useState } from 'react';
import { Terminal, Copy, Check, Layers, Cpu, Database, Play } from 'lucide-react';

interface CommandItem {
  cmd: string;
  desc: string;
  category: 'docker' | 'makefile' | 'magento' | 'inspect';
  tag?: string;
}

export const CommandCheatsheet: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const commands: CommandItem[] = [
    {
      cmd: 'docker compose up -d --build',
      desc: 'Build images and start all services in the background (triggers zero-touch installer)',
      category: 'docker',
      tag: 'Primary'
    },
    {
      cmd: 'docker compose logs -f php-cli',
      desc: 'Follow the live automated installation progress log',
      category: 'docker',
      tag: 'Essential'
    },
    {
      cmd: 'docker compose ps',
      desc: 'List running containers, health status, and mapped network ports',
      category: 'docker'
    },
    {
      cmd: 'docker compose down',
      desc: 'Stop all active containers gracefully',
      category: 'docker'
    },
    {
      cmd: 'docker compose down -v --remove-orphans',
      desc: 'Completely wipe database volumes, networks, and reset the environment',
      category: 'docker',
      tag: 'Reset'
    },
    {
      cmd: 'make up',
      desc: 'Makefile shortcut: Starts all containers with development overrides (Mailpit, Xdebug)',
      category: 'makefile'
    },
    {
      cmd: 'make cache',
      desc: 'Makefile shortcut: Clean and flush all Magento cache types',
      category: 'makefile',
      tag: 'Daily'
    },
    {
      cmd: 'make reindex',
      desc: 'Makefile shortcut: Reindex all OpenSearch and catalog indexers',
      category: 'makefile'
    },
    {
      cmd: 'make compile',
      desc: 'Makefile shortcut: Run setup:di:compile and setup:static-content:deploy',
      category: 'makefile'
    },
    {
      cmd: 'make permissions',
      desc: 'Makefile shortcut: Re-apply 755/644 filesystem permissions across var/ and pub/',
      category: 'makefile'
    },
    {
      cmd: 'make cli',
      desc: 'Makefile shortcut: Open interactive bash shell in php-cli container as magento user',
      category: 'makefile'
    },
    {
      cmd: 'docker compose exec -u magento php-fpm bin/magento cache:flush',
      desc: 'Flush all cache storage (config, layout, block_html, full_page)',
      category: 'magento',
      tag: 'Core'
    },
    {
      cmd: 'docker compose exec -u magento php-fpm bin/magento indexer:reindex',
      desc: 'Reindex catalog search, stock status, category products, and inventory',
      category: 'magento'
    },
    {
      cmd: 'docker compose exec -u magento php-fpm bin/magento deploy:mode:set developer',
      desc: 'Switch store to Developer mode (enables symlinks and on-screen stacktraces)',
      category: 'magento'
    },
    {
      cmd: 'docker compose exec -u magento php-fpm bin/magento deploy:mode:set production',
      desc: 'Switch store to Production mode (freezes OPcache, compiles static assets)',
      category: 'magento'
    },
    {
      cmd: 'docker compose exec -u magento php-fpm bin/magento maintenance:enable',
      desc: 'Put the store into maintenance mode',
      category: 'magento'
    },
    {
      cmd: 'docker compose exec -u magento php-fpm bin/magento maintenance:disable',
      desc: 'Disable maintenance mode to reopen the storefront',
      category: 'magento'
    },
    {
      cmd: 'curl -s http://localhost:9200/_cluster/health | jq .',
      desc: 'Inspect OpenSearch cluster status (should report yellow or green)',
      category: 'inspect'
    },
    {
      cmd: 'docker compose exec redis-cache redis-cli info memory',
      desc: 'Inspect Redis cache memory usage and volatile-lru eviction count',
      category: 'inspect'
    },
    {
      cmd: 'docker compose exec redis-session redis-cli dbsize',
      desc: 'Count total active customer sessions stored in Redis session node',
      category: 'inspect'
    },
    {
      cmd: 'docker compose exec mysql mysqladmin ping -u magento -pmagento_secret_pw',
      desc: 'Verify MySQL database connection responsiveness',
      category: 'inspect'
    }
  ];

  const filtered = activeCategory === 'all'
    ? commands
    : commands.filter((c) => c.category === activeCategory);

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-2xs">
        <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
          <Terminal className="w-5 h-5 text-amber-600" />
          Developer Command Cheatsheet & Terminal Reference
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          Common commands for managing your Magento 2 Docker containers, running Magento CLI tasks, and diagnosing microservices.
        </p>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-stone-100">
          {[
            { id: 'all', label: 'All Commands' },
            { id: 'docker', label: 'Docker Compose' },
            { id: 'makefile', label: 'Makefile Shortcuts' },
            { id: 'magento', label: 'Magento CLI (bin/magento)' },
            { id: 'inspect', label: 'Service Inspection' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-stone-900 text-white font-semibold shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Command List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-semibold">
                  {item.category}
                </span>
                {item.tag && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    {item.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 font-medium mb-3">{item.desc}</p>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-900 text-stone-100 font-mono text-xs gap-2">
              <span className="truncate select-all text-emerald-400">$ {item.cmd}</span>
              <button
                id={`copy-cmd-${idx}`}
                onClick={() => handleCopy(item.cmd)}
                className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white shrink-0 cursor-pointer"
                title="Copy command"
              >
                {copiedCmd === item.cmd ? (
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
  );
};
