import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  MerkleTreeBuilder,
  DurableWriteAheadLog,
  ProductionConsensusKernel,
  ByzantineEvent,
  WALEntry,
  Snapshot
} from '../../runtime/consensus';

describe('Aether Consensus Storage Kernel Tests', () => {
  const scratchDir = path.join(__dirname, '../../../scratch/test_consensus');
  const walFilePath = path.join(scratchDir, 'test_wal.log');

  // Generate a valid RSA key pair for testing signature verification
  let trustedPrivateKeyPEM: string;
  let trustedPublicKeyPEM: string;
  const testNodeId = 'node_1';

  beforeEach(() => {
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    if (fs.existsSync(walFilePath)) {
      fs.unlinkSync(walFilePath);
    }

    // Generate keys
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    trustedPrivateKeyPEM = privateKey;
    trustedPublicKeyPEM = publicKey;
  });

  afterEach(() => {
    if (fs.existsSync(walFilePath)) {
      fs.unlinkSync(walFilePath);
    }
    if (fs.existsSync(scratchDir)) {
      fs.rmSync(scratchDir, { recursive: true, force: true });
    }
  });

  describe('Merkle Tree Builder', () => {
    it('should generate deterministic root hash for empty tree', () => {
      const root = MerkleTreeBuilder.buildRoot([]);
      expect(root).toBeDefined();
      expect(typeof root).toBe('string');
    });

    it('should build balanced root for odd and even count of leaves', () => {
      const hashes = [
        crypto.createHash('sha256').update('leaf1').digest('hex'),
        crypto.createHash('sha256').update('leaf2').digest('hex'),
        crypto.createHash('sha256').update('leaf3').digest('hex')
      ];
      
      const rootOdd = MerkleTreeBuilder.buildRoot(hashes);
      const rootEven = MerkleTreeBuilder.buildRoot([...hashes, hashes[2]]);
      
      // Balancing an odd tree by repeating the last element must match the even tree
      expect(rootOdd).toEqual(rootEven);
    });
  });

  describe('Durable Write-Ahead Log (WAL)', () => {
    it('should append entries with fsync and recover them intact', () => {
      const wal = new DurableWriteAheadLog(walFilePath);
      const event: ByzantineEvent = {
        eventId: 'event_100',
        type: 'WRITE',
        timestamp: Date.now(),
        nodeId: testNodeId,
        vectorClock: { [testNodeId]: 1 },
        lamportClock: 1,
        payload: { key: 'config_key', value: 'value_100' },
        previousHash: '0'.repeat(64),
        hash: 'h'.repeat(64),
        signature: 's'.repeat(64)
      };

      wal.appendEntry(1, 1, event);
      wal.close();

      const recoveryWAL = new DurableWriteAheadLog(walFilePath);
      const entries = recoveryWAL.recoverAllEntries();
      
      expect(entries.length).toBe(1);
      expect(entries[0].index).toBe(1);
      expect(entries[0].term).toBe(1);
      expect(entries[0].event.eventId).toBe('event_100');
      expect(entries[0].event.payload.key).toBe('config_key');
      recoveryWAL.close();
    });

    it('should successfully detect Torn-Writes / corruption and throw an error', () => {
      const wal = new DurableWriteAheadLog(walFilePath);
      const event: ByzantineEvent = {
        eventId: 'event_1',
        type: 'WRITE',
        timestamp: Date.now(),
        nodeId: testNodeId,
        vectorClock: { [testNodeId]: 1 },
        lamportClock: 1,
        payload: { key: 'k', value: 'v' },
        previousHash: '0'.repeat(64),
        hash: 'h'.repeat(64),
        signature: 's'.repeat(64)
      };

      wal.appendEntry(1, 1, event);
      wal.close();

      // Corrupt the WAL file by writing malformed JSON manually
      fs.appendFileSync(walFilePath, '\n{"index": 2, "term": 1, "checksum": "corrupted_hash"}\n');

      const recoveryWAL = new DurableWriteAheadLog(walFilePath);
      expect(() => {
        recoveryWAL.recoverAllEntries();
      }).toThrow(/WAL Frame Corruption|Torn-Write Detected/);
      recoveryWAL.close();
    });
  });

  describe('Production Consensus Kernel', () => {
    let kernel: ProductionConsensusKernel;
    const peerIds = ['node_2', 'node_3'];

    beforeEach(() => {
      kernel = new ProductionConsensusKernel(
        testNodeId,
        peerIds,
        { [testNodeId]: trustedPublicKeyPEM }
      );
    });

    it('should reject Byzantine events with untrusted node signatures', () => {
      const badEvent: ByzantineEvent = {
        eventId: 'bad_event',
        type: 'WRITE',
        timestamp: Date.now(),
        nodeId: 'hacker_node',
        vectorClock: { hacker_node: 1 },
        lamportClock: 1,
        payload: { key: 'x', value: 'y' },
        previousHash: '0'.repeat(64),
        hash: 'h'.repeat(64),
        signature: 's'.repeat(64)
      };

      expect(kernel.verifyByzantineSignature(badEvent)).toBe(false);
    });

    it('should verify Byzantine events signed by trusted nodes', () => {
      const eventWithoutSig: Omit<ByzantineEvent, 'signature'> = {
        eventId: 'ok_event',
        type: 'WRITE',
        timestamp: Date.now(),
        nodeId: testNodeId,
        vectorClock: { [testNodeId]: 1 },
        lamportClock: 1,
        payload: { key: 'trusted_key', value: 'trusted_val' },
        previousHash: '0'.repeat(64),
        hash: 'some_hash'
      };

      // Sign the event payload
      const sign = crypto.createSign('sha256');
      sign.update(JSON.stringify(eventWithoutSig));
      const signature = sign.sign(trustedPrivateKeyPEM, 'hex');

      const event: ByzantineEvent = { ...eventWithoutSig, signature };
      expect(kernel.verifyByzantineSignature(event)).toBe(true);
    });

    it('should enforce Backpressure and Flow Control limits', () => {
      const peer = 'node_2';
      // In-flight capacity is 5
      expect(kernel.acquireReplicationPermit(peer)).toBe(true); // 1
      expect(kernel.acquireReplicationPermit(peer)).toBe(true); // 2
      expect(kernel.acquireReplicationPermit(peer)).toBe(true); // 3
      expect(kernel.acquireReplicationPermit(peer)).toBe(true); // 4
      expect(kernel.acquireReplicationPermit(peer)).toBe(true); // 5

      // Sixth append request must trigger Backpressure and be rejected!
      expect(kernel.acquireReplicationPermit(peer)).toBe(false);

      // Release one permit, we should be able to acquire again
      kernel.releaseReplicationPermit(peer);
      expect(kernel.acquireReplicationPermit(peer)).toBe(true);
    });

    it('should manage Majority Quorums and execute the deterministic apply loop', () => {
      kernel.setTerm(1);

      // Construct a valid signed event
      const eventWithoutSig: Omit<ByzantineEvent, 'signature'> = {
        eventId: 'event_x',
        type: 'WRITE',
        timestamp: Date.now(),
        nodeId: testNodeId,
        vectorClock: { [testNodeId]: 1 },
        lamportClock: 1,
        payload: { key: 'user_state', value: 'logged_in' },
        previousHash: '0'.repeat(64),
        hash: 'hash_123'
      };

      const sign = crypto.createSign('sha256');
      sign.update(JSON.stringify(eventWithoutSig));
      const signature = sign.sign(trustedPrivateKeyPEM, 'hex');
      const event: ByzantineEvent = { ...eventWithoutSig, signature };

      // Replicate the entry on leader
      const entry: WALEntry = {
        index: 1,
        term: 1,
        event,
        checksum: 'c'
      };

      // Append Entries directly
      const result = kernel.appendEntries({
        term: 1,
        leaderId: testNodeId,
        prevLogIndex: 0,
        prevLogTerm: 0,
        entries: [entry],
        leaderCommit: 0
      });

      expect(result.success).toBe(true);
      expect(kernel.getCommitIndex()).toBe(0); // Not committed yet: no majority quorum!

      // Replicate to node_2 (First peer). Total nodes = 3, Majority Quorum = 2 nodes.
      // Confirming node_2 match index up to 1 triggers the Majority Quorum (Leader + Node_2 = 2 nodes)!
      kernel.updatePeerState('node_2', 1);

      expect(kernel.getCommitIndex()).toBe(1); // Committed successfully by majority quorum!
      expect(kernel.getLastAppliedIndex()).toBe(1); // Applied successfully to State Machine!
      
      const memoryState = kernel.getMemoryState();
      expect(memoryState['user_state']).toBe('logged_in');
    });

    it('should perform Linearizable Reads under the ReadIndex protocol', async () => {
      kernel.setTerm(1);
      
      // Populate state machine
      const eventWithoutSig: Omit<ByzantineEvent, 'signature'> = {
        eventId: 'event_y',
        type: 'WRITE',
        timestamp: Date.now(),
        nodeId: testNodeId,
        vectorClock: { [testNodeId]: 1 },
        lamportClock: 1,
        payload: { key: 'session_token', value: 'XYZ_ABC' },
        previousHash: '0'.repeat(64),
        hash: 'hash_456'
      };

      const sign = crypto.createSign('sha256');
      sign.update(JSON.stringify(eventWithoutSig));
      const signature = sign.sign(trustedPrivateKeyPEM, 'hex');
      const event: ByzantineEvent = { ...eventWithoutSig, signature };

      const entry: WALEntry = { index: 1, term: 1, event, checksum: 'c' };

      kernel.appendEntries({
        term: 1,
        leaderId: testNodeId,
        prevLogIndex: 0,
        prevLogTerm: 0,
        entries: [entry],
        leaderCommit: 0
      });

      kernel.updatePeerState('node_2', 1); // Quorum reached & applied

      // 1. Success Linearizable Read
      const val = await kernel.executeLinearizableRead('session_token', async () => true);
      expect(val).toBe('XYZ_ABC');

      // 2. Linearizable read should fail if leadership quorum verification fails
      await expect(
        kernel.executeLinearizableRead('session_token', async () => false)
      ).rejects.toThrow(/Stale Read Blocked/);
    });
  });
});
