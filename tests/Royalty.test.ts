 
import { describe, it, expect, beforeEach } from "vitest";
import { stringUtf8CV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_TOKEN_ID = 101;
const ERR_INVALID_ROYALTY_RATE = 102;
const ERR_INVALID_SALE_AMOUNT = 103;
const ERR_TOKEN_NOT_FOUND = 105;
const ERR_INVALID_RECIPIENT = 106;
const ERR_INVALID_PERCENTAGE = 107;
const ERR_INVALID_EXPIRATION = 109;
const ERR_ROYALTY_EXPIRED = 110;
const ERR_AUTHORITY_NOT_VERIFIED = 112;
const ERR_INVALID_MIN_RATE = 113;
const ERR_INVALID_MAX_RATE = 114;
const ERR_INVALID_CURRENCY = 116;
const ERR_MAX_ROYALTIES_EXCEEDED = 118;
const ERR_INVALID_TIER = 119;
const ERR_INVALID_THRESHOLD = 120;

interface Royalty {
  tokenId: number;
  creator: string;
  rate: number;
  expiration: number;
  status: boolean;
  currency: string;
  minRate: number;
  maxRate: number;
}

interface RoyaltyRecipient {
  recipient: string;
  percentage: number;
}

interface RoyaltyTier {
  threshold: number;
  rate: number;
}

interface RoyaltyUpdate {
  updateRate: number;
  updateExpiration: number;
  updateTimestamp: number;
  updater: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class RoyaltyContractMock {
  state: {
    nextRoyaltyId: number;
    maxRoyalties: number;
    minRoyaltyRate: number;
    maxRoyaltyRate: number;
    authorityContract: string | null;
    paymentTokenContract: string;
    royalties: Map<number, Royalty>;
    royaltyRecipients: Map<string, RoyaltyRecipient>;
    royaltyTiers: Map<string, RoyaltyTier>;
    royaltyUpdates: Map<number, RoyaltyUpdate>;
  } = {
    nextRoyaltyId: 0,
    maxRoyalties: 1000,
    minRoyaltyRate: 100,
    maxRoyaltyRate: 2000,
    authorityContract: null,
    paymentTokenContract: "SP000000000000000000002Q6VF78.payments",
    royalties: new Map(),
    royaltyRecipients: new Map(),
    royaltyTiers: new Map(),
    royaltyUpdates: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  transfers: Array<{ amount: number; from: string; to: string }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextRoyaltyId: 0,
      maxRoyalties: 1000,
      minRoyaltyRate: 100,
      maxRoyaltyRate: 2000,
      authorityContract: null,
      paymentTokenContract: "SP000000000000000000002Q6VF78.payments",
      royalties: new Map(),
      royaltyRecipients: new Map(),
      royaltyTiers: new Map(),
      royaltyUpdates: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.transfers = [];
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (this.state.authorityContract !== null) return { ok: false, value: false };
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setMinRoyaltyRate(newMin: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    if (newMin >= this.state.maxRoyaltyRate) return { ok: false, value: false };
    this.state.minRoyaltyRate = newMin;
    return { ok: true, value: true };
  }

  setMaxRoyaltyRate(newMax: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    if (newMax <= this.state.minRoyaltyRate) return { ok: false, value: false };
    this.state.maxRoyaltyRate = newMax;
    return { ok: true, value: true };
  }

  setPaymentTokenContract(newContract: string): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    this.state.paymentTokenContract = newContract;
    return { ok: true, value: true };
  }

  createRoyalty(
    tokenId: number,
    rate: number,
    expiration: number,
    currency: string,
    minRate: number,
    maxRate: number
  ): Result<number> {
    if (this.state.nextRoyaltyId >= this.state.maxRoyalties) return { ok: false, value: ERR_MAX_ROYALTIES_EXCEEDED };
    if (tokenId <= 0) return { ok: false, value: ERR_INVALID_TOKEN_ID };
    if (rate < this.state.minRoyaltyRate || rate > this.state.maxRoyaltyRate) return { ok: false, value: ERR_INVALID_ROYALTY_RATE };
    if (expiration < this.blockHeight) return { ok: false, value: ERR_INVALID_EXPIRATION };
    if (!["STX", "CURA"].includes(currency)) return { ok: false, value: ERR_INVALID_CURRENCY };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };

    const id = this.state.nextRoyaltyId;
    const royalty: Royalty = {
      tokenId,
      creator: this.caller,
      rate,
      expiration,
      status: true,
      currency,
      minRate,
      maxRate,
    };
    this.state.royalties.set(id, royalty);
    this.state.nextRoyaltyId++;
    return { ok: true, value: id };
  }

  addRoyaltyRecipient(royaltyId: number, recipient: string, percentage: number, index: number): Result<boolean> {
    const royalty = this.state.royalties.get(royaltyId);
    if (!royalty) return { ok: false, value: false };
    if (royalty.creator !== this.caller) return { ok: false, value: false };
    if (recipient === this.caller) return { ok: false, value: false };
    if (percentage <= 0 || percentage > 10000) return { ok: false, value: false };
    this.state.royaltyRecipients.set(`${royaltyId}-${index}`, { recipient, percentage });
    return { ok: true, value: true };
  }

  addRoyaltyTier(royaltyId: number, tier: number, threshold: number, rate: number): Result<boolean> {
    const royalty = this.state.royalties.get(royaltyId);
    if (!royalty) return { ok: false, value: false };
    if (royalty.creator !== this.caller) return { ok: false, value: false };
    if (tier <= 0) return { ok: false, value: ERR_INVALID_TIER };
    if (threshold <= 0) return { ok: false, value: ERR_INVALID_THRESHOLD };
    if (rate < this.state.minRoyaltyRate || rate > this.state.maxRoyaltyRate) return { ok: false, value: ERR_INVALID_ROYALTY_RATE };
    this.state.royaltyTiers.set(`${royaltyId}-${tier}`, { threshold, rate });
    return { ok: true, value: true };
  }

  distributeRoyalty(royaltyId: number, saleAmount: number): Result<number> {
    const royalty = this.state.royalties.get(royaltyId);
    if (!royalty) return { ok: false, value: ERR_TOKEN_NOT_FOUND };
    if (this.blockHeight >= royalty.expiration) return { ok: false, value: ERR_ROYALTY_EXPIRED };
    if (saleAmount <= 0) return { ok: false, value: ERR_INVALID_SALE_AMOUNT };
    const royaltyAmount = Math.floor((saleAmount * royalty.rate) / 10000);
    this.transfers.push({ amount: royaltyAmount, from: this.caller, to: royalty.creator });
    return { ok: true, value: royaltyAmount };
  }

  updateRoyalty(royaltyId: number, newRate: number, newExpiration: number): Result<boolean> {
    const royalty = this.state.royalties.get(royaltyId);
    if (!royalty) return { ok: false, value: false };
    if (royalty.creator !== this.caller) return { ok: false, value: false };
    if (newRate < this.state.minRoyaltyRate || newRate > this.state.maxRoyaltyRate) return { ok: false, value: false };
    if (newExpiration < this.blockHeight) return { ok: false, value: false };
    const updated: Royalty = { ...royalty, rate: newRate, expiration: newExpiration };
    this.state.royalties.set(royaltyId, updated);
    this.state.royaltyUpdates.set(royaltyId, {
      updateRate: newRate,
      updateExpiration: newExpiration,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }

  getRoyaltyCount(): Result<number> {
    return { ok: true, value: this.state.nextRoyaltyId };
  }
}

describe("RoyaltyContract", () => {
  let contract: RoyaltyContractMock;

  beforeEach(() => {
    contract = new RoyaltyContractMock();
    contract.reset();
  });

  it("creates a royalty successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.createRoyalty(1, 500, 100, "STX", 100, 2000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const royalty = contract.state.royalties.get(0);
    expect(royalty?.tokenId).toBe(1);
    expect(royalty?.rate).toBe(500);
    expect(royalty?.expiration).toBe(100);
    expect(royalty?.currency).toBe("STX");
  });

  it("rejects invalid royalty rate", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.createRoyalty(1, 50, 100, "STX", 100, 2000);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_ROYALTY_RATE);
  });

  it("adds royalty recipient successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createRoyalty(1, 500, 100, "STX", 100, 2000);
    const result = contract.addRoyaltyRecipient(0, "ST3TEST", 2000, 0);
    expect(result.ok).toBe(true);
    const recipient = contract.state.royaltyRecipients.get("0-0");
    expect(recipient?.recipient).toBe("ST3TEST");
    expect(recipient?.percentage).toBe(2000);
  });

  it("rejects add recipient by non-creator", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createRoyalty(1, 500, 100, "STX", 100, 2000);
    contract.caller = "ST4FAKE";
    const result = contract.addRoyaltyRecipient(0, "ST3TEST", 2000, 0);
    expect(result.ok).toBe(false);
  });

  it("adds royalty tier successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createRoyalty(1, 500, 100, "STX", 100, 2000);
    const result = contract.addRoyaltyTier(0, 1, 1000, 600);
    expect(result.ok).toBe(true);
    const tier = contract.state.royaltyTiers.get("0-1");
    expect(tier?.threshold).toBe(1000);
    expect(tier?.rate).toBe(600);
  });

  it("distributes royalty successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createRoyalty(1, 1000, 100, "STX", 100, 2000);
    contract.blockHeight = 50;
    const result = contract.distributeRoyalty(0, 10000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(1000);
    expect(contract.transfers).toEqual([{ amount: 1000, from: "ST1TEST", to: "ST1TEST" }]);
  });

  it("rejects expired royalty distribution", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createRoyalty(1, 1000, 100, "STX", 100, 2000);
    contract.blockHeight = 150;
    const result = contract.distributeRoyalty(0, 10000);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_ROYALTY_EXPIRED);
  });

  it("updates royalty successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createRoyalty(1, 500, 100, "STX", 100, 2000);
    const result = contract.updateRoyalty(0, 600, 200);
    expect(result.ok).toBe(true);
    const royalty = contract.state.royalties.get(0);
    expect(royalty?.rate).toBe(600);
    expect(royalty?.expiration).toBe(200);
    const update = contract.state.royaltyUpdates.get(0);
    expect(update?.updateRate).toBe(600);
    expect(update?.updateExpiration).toBe(200);
  });

  it("rejects update by non-creator", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createRoyalty(1, 500, 100, "STX", 100, 2000);
    contract.caller = "ST4FAKE";
    const result = contract.updateRoyalty(0, 600, 200);
    expect(result.ok).toBe(false);
  });

  it("sets min royalty rate successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setMinRoyaltyRate(200);
    expect(result.ok).toBe(true);
    expect(contract.state.minRoyaltyRate).toBe(200);
  });

  it("rejects invalid min royalty rate", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setMinRoyaltyRate(3000);
    expect(result.ok).toBe(false);
  });

  it("gets royalty count correctly", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createRoyalty(1, 500, 100, "STX", 100, 2000);
    contract.createRoyalty(2, 600, 200, "CURA", 100, 2000);
    const result = contract.getRoyaltyCount();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(2);
  });
});