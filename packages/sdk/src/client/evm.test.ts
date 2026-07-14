import { describe, it, expect, beforeAll } from 'vitest';
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  type PublicClient,
  type WalletClient,
  type Address,
} from 'viem';
import { foundry } from 'viem/chains';
import { EvmA2AClient } from './evm.js';

const ANVIL_RPC = 'http://127.0.0.1:8545';

describe('EvmA2AClient', () => {
  let publicClient: PublicClient;
  let walletClient: WalletClient;
  let agentRegistryAddress: Address;
  let taskRegistryAddress: Address;
  let buyerAddress: Address;
  let workerAddress: Address;
  let buyerKey: `0x${string}`;
  let workerKey: `0x${string}`;

  beforeAll(async () => {
    publicClient = createPublicClient({
      chain: foundry,
      transport: http(ANVIL_RPC),
    });

    walletClient = createWalletClient({
      chain: foundry,
      transport: http(ANVIL_RPC),
    });

    const accounts = await walletClient.getAddresses();
    buyerAddress = accounts[0];
    workerAddress = accounts[1];

    // Get private keys from anvil accounts
    // Anvil default accounts: these are the first two accounts
    buyerKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as `0x${string}`;
    workerKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as `0x${string}`;
  });

  it('should deploy contracts and register agents', async () => {
    const { bytecode: agentRegistryBytecode } = await import(
      '../../../contracts-evm/out/AgentRegistry.sol/AgentRegistry.json'
    );
    const { bytecode: taskRegistryBytecode } = await import(
      '../../../contracts-evm/out/TaskRegistry.sol/TaskRegistry.json'
    );

    const deployAgentRegistry = await walletClient.deployContract({
      abi: [
        {
          type: 'constructor',
          inputs: [],
        },
        {
          type: 'function',
          name: 'register',
          inputs: [
            { name: 'agentAddress', type: 'address' },
            { name: 'name', type: 'string' },
            { name: 'metadataUri', type: 'string' },
          ],
          outputs: [],
          stateMutability: 'nonpayable',
        },
        {
          type: 'function',
          name: 'getAgent',
          inputs: [{ name: 'agentAddress', type: 'address' }],
          outputs: [
            {
              type: 'tuple',
              components: [
                { name: 'owner', type: 'address' },
                { name: 'name', type: 'string' },
                { name: 'metadataUri', type: 'string' },
                { name: 'reputationScore', type: 'uint256' },
                { name: 'totalStake', type: 'uint256' },
                { name: 'tasksCompleted', type: 'uint256' },
                { name: 'tasksFailed', type: 'uint256' },
                { name: 'active', type: 'bool' },
                { name: 'registeredAt', type: 'uint256' },
                { name: 'updatedAt', type: 'uint256' },
              ],
            },
          ],
          stateMutability: 'view',
        },
        {
          type: 'function',
          name: 'isActive',
          inputs: [{ name: 'agentAddress', type: 'address' }],
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'view',
        },
        {
          type: 'function',
          name: 'setReputation',
          inputs: [
            { name: 'agentAddress', type: 'address' },
            { name: 'score', type: 'uint256' },
          ],
          outputs: [],
          stateMutability: 'nonpayable',
        },
        {
          type: 'function',
          name: 'addStake',
          inputs: [
            { name: 'agentAddress', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [],
          stateMutability: 'nonpayable',
        },
        {
          type: 'function',
          name: 'recordCompletion',
          inputs: [{ name: 'agentAddress', type: 'address' }],
          outputs: [],
          stateMutability: 'nonpayable',
        },
        {
          type: 'function',
          name: 'recordFailure',
          inputs: [{ name: 'agentAddress', type: 'address' }],
          outputs: [],
          stateMutability: 'nonpayable',
        },
      ],
      bytecode: agentRegistryBytecode as `0x${string}`,
      account: buyerAddress,
    });

    const agentRegistryReceipt = await publicClient.waitForTransactionReceipt({
      hash: deployAgentRegistry,
    });
    agentRegistryAddress = agentRegistryReceipt.contractAddress!;

    const deployTaskRegistry = await walletClient.deployContract({
      abi: [
        {
          type: 'constructor',
          inputs: [{ name: '_agentRegistry', type: 'address' }],
        },
        {
          type: 'receive',
          stateMutability: 'payable',
        },
        {
          type: 'function',
          name: 'createTask',
          inputs: [
            { name: 'buyerAgent', type: 'address' },
            { name: 'acceptanceCriteriaHash', type: 'string' },
            { name: 'deadline', type: 'uint256' },
          ],
          outputs: [{ name: 'taskId', type: 'uint256' }],
          stateMutability: 'payable',
        },
        {
          type: 'function',
          name: 'assignTask',
          inputs: [
            { name: 'taskId', type: 'uint256' },
            { name: 'workerAgent', type: 'address' },
          ],
          outputs: [],
          stateMutability: 'nonpayable',
        },
        {
          type: 'function',
          name: 'submitTask',
          inputs: [
            { name: 'taskId', type: 'uint256' },
            { name: 'submissionHash', type: 'string' },
          ],
          outputs: [],
          stateMutability: 'nonpayable',
        },
        {
          type: 'function',
          name: 'completeTask',
          inputs: [{ name: 'taskId', type: 'uint256' }],
          outputs: [],
          stateMutability: 'nonpayable',
        },
        {
          type: 'function',
          name: 'failTask',
          inputs: [{ name: 'taskId', type: 'uint256' }],
          outputs: [],
          stateMutability: 'nonpayable',
        },
        {
          type: 'function',
          name: 'cancelTask',
          inputs: [{ name: 'taskId', type: 'uint256' }],
          outputs: [],
          stateMutability: 'nonpayable',
        },
        {
          type: 'function',
          name: 'getTask',
          inputs: [{ name: 'taskId', type: 'uint256' }],
          outputs: [
            {
              type: 'tuple',
              components: [
                { name: 'buyerAgent', type: 'address' },
                { name: 'workerAgent', type: 'address' },
                { name: 'bounty', type: 'uint256' },
                { name: 'acceptanceCriteriaHash', type: 'string' },
                { name: 'submissionHash', type: 'string' },
                { name: 'status', type: 'uint8' },
                { name: 'deadline', type: 'uint256' },
                { name: 'createdAt', type: 'uint256' },
                { name: 'submittedAt', type: 'uint256' },
                { name: 'completedAt', type: 'uint256' },
              ],
            },
          ],
          stateMutability: 'view',
        },
        {
          type: 'function',
          name: 'getTaskEscrow',
          inputs: [{ name: 'taskId', type: 'uint256' }],
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
        },
        {
          type: 'function',
          name: 'getTaskStatus',
          inputs: [{ name: 'taskId', type: 'uint256' }],
          outputs: [{ name: '', type: 'uint8' }],
          stateMutability: 'view',
        },
        {
          type: 'event',
          name: 'TaskCreated',
          inputs: [
            { name: 'taskId', type: 'uint256', indexed: true },
            { name: 'buyerAgent', type: 'address', indexed: true },
            { name: 'bounty', type: 'uint256' },
            { name: 'acceptanceCriteriaHash', type: 'string' },
          ],
        },
      ],
      args: [agentRegistryAddress],
      bytecode: taskRegistryBytecode as `0x${string}`,
      account: buyerAddress,
    });

    const taskRegistryReceipt = await publicClient.waitForTransactionReceipt({
      hash: deployTaskRegistry,
    });
    taskRegistryAddress = taskRegistryReceipt.contractAddress!;

    const registerAbi = [
      {
        type: 'function',
        name: 'register',
        inputs: [
          { name: 'agentAddress', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'metadataUri', type: 'string' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
    ] as const;

    const registerBuyer = await walletClient.writeContract({
      address: agentRegistryAddress,
      abi: registerAbi,
      functionName: 'register',
      args: [buyerAddress, 'Buyer Agent', 'QmBuyerMetadata'],
      account: buyerAddress,
    });
    await publicClient.waitForTransactionReceipt({ hash: registerBuyer });

    const registerWorker = await walletClient.writeContract({
      address: agentRegistryAddress,
      abi: registerAbi,
      functionName: 'register',
      args: [workerAddress, 'Worker Agent', 'QmWorkerMetadata'],
      account: workerAddress,
    });
    await publicClient.waitForTransactionReceipt({ hash: registerWorker });

    expect(agentRegistryAddress).toBeDefined();
    expect(taskRegistryAddress).toBeDefined();
  });

  describe('postTask', () => {
    it('should create a task with escrow', async () => {
      const client = new EvmA2AClient({
        chain: 'evm',
        rpcUrl: ANVIL_RPC,
        privateKey: buyerKey,
        programIds: {
          agentRegistry: agentRegistryAddress,
          taskRegistry: taskRegistryAddress,
          verificationOracle: '0x0000000000000000000000000000000000000000',
        },
      });

      const result = await client.postTask({
        buyerAgent: buyerAddress,
        acceptanceCriteriaHash: 'QmAcceptanceCriteria123',
        deadline: Math.floor(Date.now() / 1000) + 86400,
        bountyLamports: parseEther('1'),
      });

      expect(result.taskId).toBeDefined();
      expect(result.txHash).toBeDefined();
      expect(result.taskId).toBe('0');
    });

    it('should reject zero bounty', async () => {
      const client = new EvmA2AClient({
        chain: 'evm',
        rpcUrl: ANVIL_RPC,
        privateKey: buyerKey,
        programIds: {
          agentRegistry: agentRegistryAddress,
          taskRegistry: taskRegistryAddress,
          verificationOracle: '0x0000000000000000000000000000000000000000',
        },
      });

      await expect(
        client.postTask({
          buyerAgent: buyerAddress,
          acceptanceCriteriaHash: 'QmAcceptanceCriteria',
          deadline: 0,
          bountyLamports: 0n,
        }),
      ).rejects.toThrow();
    });
  });

  describe('submitBid', () => {
    it('should assign a worker to a task', async () => {
      const client = new EvmA2AClient({
        chain: 'evm',
        rpcUrl: ANVIL_RPC,
        privateKey: buyerKey,
        programIds: {
          agentRegistry: agentRegistryAddress,
          taskRegistry: taskRegistryAddress,
          verificationOracle: '0x0000000000000000000000000000000000000000',
        },
      });

      const postResult = await client.postTask({
        buyerAgent: buyerAddress,
        acceptanceCriteriaHash: 'QmCriteria2',
        deadline: 0,
        bountyLamports: parseEther('0.5'),
      });

      const bidResult = await client.submitBid({
        taskId: postResult.taskId,
        workerAgent: workerAddress,
        submissionHash: 'QmBidProposal',
      });

      expect(bidResult.txHash).toBeDefined();
    });
  });

  describe('releaseEscrow', () => {
    it('should release escrow to worker on task completion', async () => {
      const client = new EvmA2AClient({
        chain: 'evm',
        rpcUrl: ANVIL_RPC,
        privateKey: buyerKey,
        programIds: {
          agentRegistry: agentRegistryAddress,
          taskRegistry: taskRegistryAddress,
          verificationOracle: '0x0000000000000000000000000000000000000000',
        },
      });

      const postResult = await client.postTask({
        buyerAgent: buyerAddress,
        acceptanceCriteriaHash: 'QmCriteria3',
        deadline: 0,
        bountyLamports: parseEther('0.1'),
      });

      await client.submitBid({
        taskId: postResult.taskId,
        workerAgent: workerAddress,
        submissionHash: 'QmBid3',
      });

      const workerBalanceBefore = await publicClient.getBalance({ address: workerAddress });

      const releaseResult = await client.releaseEscrow({
        taskId: postResult.taskId,
      });

      expect(releaseResult.txHash).toBeDefined();

      const workerBalanceAfter = await publicClient.getBalance({ address: workerAddress });
      expect(workerBalanceAfter - workerBalanceBefore).toBe(parseEther('0.1'));
    });
  });

  describe('getAgentReputation', () => {
    it('should return agent reputation data', async () => {
      const client = new EvmA2AClient({
        chain: 'evm',
        rpcUrl: ANVIL_RPC,
        privateKey: buyerKey,
        programIds: {
          agentRegistry: agentRegistryAddress,
          taskRegistry: taskRegistryAddress,
          verificationOracle: '0x0000000000000000000000000000000000000000',
        },
      });

      const reputation = await client.getAgentReputation(buyerAddress);

      expect(reputation.agentAddress).toBe(buyerAddress);
      expect(reputation.reputationScore).toBe(0n);
      expect(reputation.totalStake).toBe(0n);
      expect(reputation.tasksCompleted).toBe(0n);
      expect(reputation.tasksFailed).toBe(0n);
    });
  });
});
