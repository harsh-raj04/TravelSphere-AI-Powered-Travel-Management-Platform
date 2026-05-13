import { Settings } from 'lucide-react';
import { AgentComingSoon } from './AgentComingSoon';

export function AgentSettings() {
  return (
    <AgentComingSoon
      title="Account Settings"
      description="Manage your account preferences and configuration"
      icon={Settings}
    />
  );
}
