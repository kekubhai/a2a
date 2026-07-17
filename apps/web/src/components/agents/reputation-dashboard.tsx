'use client';

import { AgentDTO } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingUp, AlertTriangle, Wallet } from 'lucide-react';

interface ReputationDashboardProps {
  agent: AgentDTO;
}

export function ReputationDashboard({ agent }: ReputationDashboardProps) {
  const reputationScore = parseFloat(agent.reputationScore);
  const totalStake = parseFloat(agent.totalStake);
  const tasksCompleted = parseInt(agent.tasksCompleted);
  const tasksFailed = parseInt(agent.tasksFailed);
  const totalTasks = tasksCompleted + tasksFailed;
  const successRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

  // Calculate stake-at-risk (simplified formula)
  const stakeAtRisk = totalStake * (1 - reputationScore / 10000);
  
  // Reputation tier
  const getReputationTier = (score: number) => {
    if (score >= 9000) return { label: 'Elite', color: 'bg-purple-500' };
    if (score >= 7500) return { label: 'Excellent', color: 'bg-blue-500' };
    if (score >= 6000) return { label: 'Good', color: 'bg-green-500' };
    if (score >= 4000) return { label: 'Fair', color: 'bg-yellow-500' };
    return { label: 'Basic', color: 'bg-gray-500' };
  };

  const tier = getReputationTier(reputationScore);

  return (
    <div className="space-y-4">
      {/* Reputation Score Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Reputation Score
          </h3>
          <Badge className={tier.color}>{tier.label}</Badge>
        </div>
        
        <div className="mb-4">
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-bold">{(reputationScore / 100).toFixed(1)}%</span>
            <span className="text-sm text-muted-foreground mb-1">/ 100%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${tier.color}`}
              style={{ width: `${reputationScore / 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Tasks Completed</p>
            <p className="font-semibold text-green-600">{tasksCompleted}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tasks Failed</p>
            <p className="font-semibold text-red-600">{tasksFailed}</p>
          </div>
        </div>
      </Card>

      {/* Stake Analysis Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Stake Analysis</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Total Staked</span>
              <span className="font-semibold">{totalStake.toFixed(4)} ETH</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Stake at Risk
              </span>
              <span className="font-semibold text-orange-600">{stakeAtRisk.toFixed(4)} ETH</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: `${(stakeAtRisk / totalStake) * 100}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Success Rate</span>
              <span className="font-semibold flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                {successRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Incentive Alignment Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <h3 className="text-lg font-semibold mb-3">Incentive Alignment</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This agent has <span className="font-semibold text-orange-600">{stakeAtRisk.toFixed(4)} ETH</span> at risk based on their reputation score. 
          Higher reputation = less stake at risk = more trusted by buyers.
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>✓ Verified submissions increase reputation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>✗ Failed verifications slash stake and reduce reputation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>✓ Higher stake requirements for premium tasks</span>
          </div>
        </div>
      </Card>
    </div>
  );
}