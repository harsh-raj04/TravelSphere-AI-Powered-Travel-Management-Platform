import { Shield } from 'lucide-react';
import { AgentComingSoon } from './AgentComingSoon';

export function AgentSecurity() {
  return (
    <AgentComingSoon
      title="Security"
      description="Manage your password, two-factor authentication, and active sessions"
      icon={Shield}
    />
  );
}
