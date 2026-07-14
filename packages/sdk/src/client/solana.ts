import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import type {
  A2AClient,
  ClientConfig,
  PostTaskParams,
  PostTaskResult,
  SubmitBidParams,
  SubmitBidResult,
  ReleaseEscrowParams,
  ReleaseEscrowResult,
  AgentReputation,
} from './types.js';

const TASK_REGISTRY_INSTRUCTION_LAYOUT = {
  createTask: 0,
  assignTask: 1,
  submitTask: 2,
  completeTask: 3,
  failTask: 4,
  cancelTask: 5,
};

const AGENT_REGISTRY_INSTRUCTION_LAYOUT = {
  registerAgent: 0,
  setReputation: 7,
};

export interface SolanaClientAddresses {
  agentRegistry: string;
  taskRegistry: string;
}

export class SolanaA2AClient implements A2AClient {
  private connection: Connection;
  private payer: Keypair;
  private addresses: SolanaClientAddresses;

  constructor(config: ClientConfig) {
    this.connection = new Connection(config.rpcUrl, 'confirmed');

    if (config.privateKey) {
      const secretKey = Uint8Array.from(JSON.parse(config.privateKey));
      this.payer = Keypair.fromSecretKey(secretKey);
    } else {
      this.payer = Keypair.generate();
    }

    this.addresses = {
      agentRegistry: config.programIds?.agentRegistry || '',
      taskRegistry: config.programIds?.taskRegistry || '',
    };
  }

  private async findTaskPda(buyer: PublicKey, timestamp: BN): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('task'), buyer.toBuffer(), timestamp.toArrayLike(Buffer, 'le', 8)],
      new PublicKey(this.addresses.taskRegistry),
    );
  }

  private async findEscrowPda(taskPda: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), taskPda.toBuffer()],
      new PublicKey(this.addresses.taskRegistry),
    );
  }

  private async findAgentPda(owner: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), owner.toBuffer()],
      new PublicKey(this.addresses.agentRegistry),
    );
  }

  private encodeCreateTask(
    buyerAgent: PublicKey,
    acceptanceCriteriaHash: string,
    bountyAmount: BN,
    deadline: BN,
  ): Uint8Array {
    const buffer = Buffer.alloc(1000);
    let offset = 0;

    buffer.writeUInt32LE(TASK_REGISTRY_INSTRUCTION_LAYOUT.createTask, offset);
    offset += 4;

    const buyerBytes = buyerAgent.toBuffer();
    buyerBytes.forEach((b, i) => { buffer[offset + i] = b; });
    offset += 32;

    const hashBytes = Buffer.from(acceptanceCriteriaHash, 'utf8');
    buffer.writeUInt32LE(hashBytes.length, offset);
    offset += 4;
    hashBytes.forEach((b, i) => { buffer[offset + i] = b; });
    offset += hashBytes.length;

    const bountyBuf = Buffer.alloc(8);
    bountyBuf.writeBigUInt64LE(BigInt(bountyAmount.toString()));
    bountyBuf.forEach((b, i) => { buffer[offset + i] = b; });
    offset += 8;

    const deadlineBuf = Buffer.alloc(8);
    deadlineBuf.writeBigInt64LE(BigInt(deadline.toString()));
    deadlineBuf.forEach((b, i) => { buffer[offset + i] = b; });
    offset += 8;

    return new Uint8Array(buffer.subarray(0, offset));
  }

  private encodeAssignTask(workerAgent: PublicKey): Uint8Array {
    const buffer = Buffer.alloc(100);
    let offset = 0;

    buffer.writeUInt32LE(TASK_REGISTRY_INSTRUCTION_LAYOUT.assignTask, offset);
    offset += 4;

    const workerBytes = workerAgent.toBuffer();
    workerBytes.forEach((b, i) => { buffer[offset + i] = b; });
    offset += 32;

    return new Uint8Array(buffer.subarray(0, offset));
  }

  private encodeCompleteTask(): Uint8Array {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(TASK_REGISTRY_INSTRUCTION_LAYOUT.completeTask, 0);
    return new Uint8Array(buffer);
  }

  private encodeRegisterAgent(name: string, metadataUri: string, capabilities: string[]): Uint8Array {
    const buffer = Buffer.alloc(1000);
    let offset = 0;

    buffer.writeUInt32LE(AGENT_REGISTRY_INSTRUCTION_LAYOUT.registerAgent, offset);
    offset += 4;

    const nameBytes = Buffer.from(name, 'utf8');
    buffer.writeUInt32LE(nameBytes.length, offset);
    offset += 4;
    nameBytes.forEach((b, i) => { buffer[offset + i] = b; });
    offset += nameBytes.length;

    const metaBytes = Buffer.from(metadataUri, 'utf8');
    buffer.writeUInt32LE(metaBytes.length, offset);
    offset += 4;
    metaBytes.forEach((b, i) => { buffer[offset + i] = b; });
    offset += metaBytes.length;

    buffer.writeUInt32LE(capabilities.length, offset);
    offset += 4;
    for (const cap of capabilities) {
      const capBytes = Buffer.from(cap, 'utf8');
      buffer.writeUInt32LE(capBytes.length, offset);
      offset += 4;
      capBytes.forEach((b, i) => { buffer[offset + i] = b; });
      offset += capBytes.length;
    }

    return new Uint8Array(buffer.subarray(0, offset));
  }

  async postTask(params: PostTaskParams): Promise<PostTaskResult> {
    const buyer = new PublicKey(params.buyerAgent);
    const timestamp = new BN(Math.floor(Date.now() / 1000));
    const [taskPda] = await this.findTaskPda(buyer, timestamp);
    const [escrowPda] = await this.findEscrowPda(taskPda);

    const data = this.encodeCreateTask(
      buyer,
      params.acceptanceCriteriaHash,
      new BN(params.bountyLamports.toString()),
      new BN(params.deadline),
    );

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: taskPda, isSigner: false, isWritable: true },
        { pubkey: escrowPda, isSigner: false, isWritable: true },
        { pubkey: this.payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: new PublicKey(this.addresses.taskRegistry),
      data: Buffer.from(data),
    });

    const transaction = new Transaction().add(instruction);
    const txHash = await sendAndConfirmTransaction(this.connection, transaction, [this.payer]);

    return {
      taskId: taskPda.toString(),
      txHash,
    };
  }

  async submitBid(params: SubmitBidParams): Promise<SubmitBidResult> {
    const taskPda = new PublicKey(params.taskId);
    const worker = new PublicKey(params.workerAgent);

    const data = this.encodeAssignTask(worker);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: taskPda, isSigner: false, isWritable: true },
        { pubkey: this.payer.publicKey, isSigner: true, isWritable: false },
      ],
      programId: new PublicKey(this.addresses.taskRegistry),
      data: Buffer.from(data),
    });

    const transaction = new Transaction().add(instruction);
    const txHash = await sendAndConfirmTransaction(this.connection, transaction, [this.payer]);

    return { txHash };
  }

  async releaseEscrow(params: ReleaseEscrowParams): Promise<ReleaseEscrowResult> {
    const taskPda = new PublicKey(params.taskId);
    const [escrowPda] = await this.findEscrowPda(taskPda);

    const taskAccountInfo = await this.connection.getAccountInfo(taskPda);
    if (!taskAccountInfo) {
      throw new Error('Task account not found');
    }

    const workerAgent = new PublicKey(taskAccountInfo.data.subarray(32, 64));

    const data = this.encodeCompleteTask();

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: taskPda, isSigner: false, isWritable: true },
        { pubkey: escrowPda, isSigner: false, isWritable: true },
        { pubkey: workerAgent, isSigner: false, isWritable: true },
        { pubkey: this.payer.publicKey, isSigner: true, isWritable: false },
      ],
      programId: new PublicKey(this.addresses.taskRegistry),
      data: Buffer.from(data),
    });

    const transaction = new Transaction().add(instruction);
    const txHash = await sendAndConfirmTransaction(this.connection, transaction, [this.payer]);

    return { txHash };
  }

  async getAgentReputation(agentAddress: string): Promise<AgentReputation> {
    const owner = new PublicKey(agentAddress);
    const [agentPda] = await this.findAgentPda(owner);

    const accountInfo = await this.connection.getAccountInfo(agentPda);
    if (!accountInfo) {
      return {
        agentAddress,
        reputationScore: 0n,
        totalStake: 0n,
        tasksCompleted: 0n,
        tasksFailed: 0n,
      };
    }

    const data = accountInfo.data;
    const reputationScore = data.readBigUInt64LE(64 + 64 + 256 + 32);
    const totalStake = data.readBigUInt64LE(64 + 64 + 256 + 32 + 8);
    const tasksCompleted = data.readBigUInt64LE(64 + 64 + 256 + 32 + 16);
    const tasksFailed = data.readBigUInt64LE(64 + 64 + 256 + 32 + 24);

    return {
      agentAddress,
      reputationScore,
      totalStake,
      tasksCompleted,
      tasksFailed,
    };
  }
}
