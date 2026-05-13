import { FileText } from 'lucide-react';
import { AgentComingSoon } from './AgentComingSoon';

export function AgentDocuments() {
  return (
    <AgentComingSoon
      title="Documents"
      description="Store and manage your travel-related documents and certifications"
      icon={FileText}
    />
  );
}
