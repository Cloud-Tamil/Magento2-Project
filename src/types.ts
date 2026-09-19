export interface ProjectFile {
  path: string;
  name: string;
  category: 'core' | 'docker' | 'nginx' | 'php' | 'database' | 'search' | 'queue' | 'scripts' | 'docs';
  language: 'bash' | 'dockerfile' | 'ini' | 'nginx' | 'sql' | 'json' | 'yaml' | 'markdown' | 'properties';
  purpose: string;
  content: string;
}

export interface ServiceNode {
  id: string;
  name: string;
  containerName: string;
  image: string;
  ports: string[];
  role: string;
  purpose: string;
  healthcheck: string;
  configFile: string;
  dependencies: string[];
  icon: string;
}

export interface AutomationStep {
  step: number;
  title: string;
  command: string;
  description: string;
  purpose: string;
  container: string;
}
