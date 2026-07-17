'use client';

import { AgentDTO } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';

interface CrossChainReputationBadgeProps {
  agent: AgentDTO;
  chains?: Array<{ chainId: string; reputationScore: string }>;
}

export function CrossChainReputationBadge({ agent, chains = [] }: CrossChainReputationBadgeProps) {
  const currentChainReputation = parseFloat(agent.reputationScore);
  const currentChainType = agent.chainType;
  const currentChainId = agent.chainId;

  // Combine current chain with additional chain reputations
  const allChainReputations = [
    { chainId: currentChainId, chainType: currentChainType, reputationScore: currentChainReputation },
    ...chains.map(chain => ({
      chainId: chain.chainId,
      chainType: chain.chainId.includes('solana') ? 'solana' : 'evm',
      reputationScore: parseFloat(chain.reputationScore)
    }))
  ];

  // Calculate unified reputation (weighted average by recent activity)
  const unifiedReputation = calculateUnifiedReputation(allChainReputations);
  
  // Get badge color based on unified reputation
  const getBadgeColor = (score: number) => {
    if (score >= 9000) return 'bg-purple-500';
    if (score >= 7500) return 'bg-blue-500';
    if (score >= 6000) return 'bg-green-500';
    if (score >= 4000) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getReputationTier = (score: number) => {
    if (score >= 9000) return 'Elite';
    if (score >= 7500) return 'Excellent';
    if (score >= 6000) return 'Good';
    if (score >= 4000) return 'Fair';
    return 'Basic';
  };

  const badgeColor = getBadgeColor(unifiedReputation);
  const tier = getReputationTier(unifiedReputation);

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${badgeColor} text-white`}>
        <Globe className="w-3 h-3 mr-1" />
        {tier}
      </Badge>
      <span className="text-sm font-semibold">{(unifiedReputation / 100).toFixed(1)}%</span>
      {allChainReputations.length > 1 && (
        <span className="text-xs text-muted-foreground">
          ({allChainReputations.length} chains)
        </span>
      )}
    </div>
  );
}

function calculateUnifiedReputation(chainReputations: Array<{
  chainId: string;
  chainType: string;
  reputationScore: number;
}>): number {
  if (chainReputations.length === 0) return 0;
  
  // Simple weighted average (in production, would weight by recent activity)
  const totalScore = chainReputations.reduce((sum, chain) => sum + chain.reputationScore, 0);
  return Math.round(totalScore / chainReputations.length);
}