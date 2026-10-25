import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
type FMCGSupplyChain = any;
type HardhatEthersSigner = any;

// ─────────────────────────────────────────────────────
// Status enum values matching the contract
// ─────────────────────────────────────────────────────
const Status = {
  REGISTERED: 0,
  IN_TRANSIT: 1,
  RECEIVED:   2,
  IN_STOCK:   3,
  SOLD:       4,
  DELIVERED:  5,
  QUARANTINED:6,
  RECALLED:   7,
  DAMAGED:    8,
  EXPIRED:    9,
};

describe("FMCGSupplyChain", function () {
  let contract: FMCGSupplyChain;
  let admin: HardhatEthersSigner;
  let manufacturer: HardhatEthersSigner;
  let distributor: HardhatEthersSigner;
  let warehouse: HardhatEthersSigner;
  let retailer: HardhatEthersSigner;
  let customer: HardhatEthersSigner;

  const MANUFACTURER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER_ROLE"));
  const DISTRIBUTOR_ROLE  = ethers.keccak256(ethers.toUtf8Bytes("DISTRIBUTOR_ROLE"));
  const WAREHOUSE_ROLE    = ethers.keccak256(ethers.toUtf8Bytes("WAREHOUSE_ROLE"));
  const RETAILER_ROLE     = ethers.keccak256(ethers.toUtf8Bytes("RETAILER_ROLE"));

  // Helper: compute product ID the same way the contract does
  const productId = (sku: string, mfr: string) =>
    ethers.keccak256(ethers.solidityPacked(["string", "address"], [sku, mfr]));

  const batchId = (batchNum: string, prodId: string, mfr: string) =>
    ethers.keccak256(ethers.solidityPacked(["string", "bytes32", "address"], [batchNum, prodId, mfr]));

  const unitId = (serial: string, bId: string) =>
    ethers.keccak256(ethers.solidityPacked(["string", "bytes32"], [serial, bId]));

  // Sample data
  const SKU        = "CC-500ML-001";
  const PRODUCT    = { name: "Coca-Cola 500ml", brand: "Coca-Cola", category: "Beverage" };
  const BATCH_NUM  = "LC-2024-001";
  const MFG_DATE   = Math.floor(Date.now() / 1000) - 86400; // yesterday
  const EXP_DATE   = Math.floor(Date.now() / 1000) + 365 * 86400; // 1 year from now
  const QUANTITY   = 10000;
  const PKG_TYPE   = "Carton";
  const SERIAL     = "UNIT-001";

  let PID: string;   // product type id
  let BID: string;   // batch id
  let UID: string;   // unit id

  // ───────────────────────────────────────────────────────────
  // SETUP: Deploy fresh contract before each test
  // ───────────────────────────────────────────────────────────
  beforeEach(async function () {
    [admin, manufacturer, distributor, warehouse, retailer, customer] =
      await ethers.getSigners();

    const Factory = await ethers.getContractFactory("FMCGSupplyChain");
    contract = await Factory.deploy(admin.address) as FMCGSupplyChain;
    await contract.waitForDeployment();

    // Grant roles
    await contract.connect(admin).assignRole(manufacturer.address, MANUFACTURER_ROLE);
    await contract.connect(admin).assignRole(distributor.address,  DISTRIBUTOR_ROLE);
    await contract.connect(admin).assignRole(warehouse.address,    WAREHOUSE_ROLE);
    await contract.connect(admin).assignRole(retailer.address,     RETAILER_ROLE);

    // Pre-compute IDs
    PID = productId(SKU, manufacturer.address);
    BID = batchId(BATCH_NUM, PID, manufacturer.address);
    UID = unitId(SERIAL, BID);
  });

  // ───────────────────────────────────────────────────────────
  // SECTION 1: Role Management
  // ───────────────────────────────────────────────────────────
  describe("1. Role Management", function () {
    it("Admin is granted DEFAULT_ADMIN_ROLE at deployment", async function () {
      const DEFAULT_ADMIN = ethers.ZeroHash;
      expect(await contract.hasRole(DEFAULT_ADMIN, admin.address)).to.be.true;
    });

    it("Admin can assign MANUFACTURER_ROLE", async function () {
      expect(await contract.hasRole(MANUFACTURER_ROLE, manufacturer.address)).to.be.true;
    });

    it("Admin can assign DISTRIBUTOR_ROLE", async function () {
      expect(await contract.hasRole(DISTRIBUTOR_ROLE, distributor.address)).to.be.true;
    });

    it("Admin can revoke a role", async function () {
      await contract.connect(admin).revokeParticipantRole(distributor.address, DISTRIBUTOR_ROLE);
      expect(await contract.hasRole(DISTRIBUTOR_ROLE, distributor.address)).to.be.false;
    });

    it("Non-admin cannot assign roles", async function () {
      await expect(
        contract.connect(manufacturer).assignRole(customer.address, MANUFACTURER_ROLE)
      ).to.be.reverted;
    });

    it("RoleAssigned event is emitted on role assignment", async function () {
      await expect(contract.connect(admin).assignRole(customer.address, RETAILER_ROLE))
        .to.emit(contract, "RoleAssigned")
        .withArgs(customer.address, RETAILER_ROLE, admin.address);
    });
  });

  // ───────────────────────────────────────────────────────────
  // SECTION 2: Product Registration
  // ───────────────────────────────────────────────────────────
  describe("2. Product Type Registration", function () {
    it("Manufacturer can register a product type", async function () {
      await contract.connect(manufacturer).registerProduct(
        SKU, PRODUCT.name, PRODUCT.brand, PRODUCT.category
      );
      const p = await contract.getProductType(PID);
      expect(p.name).to.equal(PRODUCT.name);
      expect(p.skuCode).to.equal(SKU);
      expect(p.manufacturer).to.equal(manufacturer.address);
    });

    it("ProductRegistered event is emitted with correct parameters", async function () {
      await expect(
        contract.connect(manufacturer).registerProduct(
          SKU, PRODUCT.name, PRODUCT.brand, PRODUCT.category
        )
      )
        .to.emit(contract, "ProductRegistered")
        .withArgs(PID, PRODUCT.name, SKU, manufacturer.address, anyValue);
    });

    it("Non-manufacturer cannot register a product", async function () {
      await expect(
        contract.connect(customer).registerProduct(
          SKU, PRODUCT.name, PRODUCT.brand, PRODUCT.category
        )
      ).to.be.reverted;
    });

    it("Prevents duplicate SKU from same manufacturer", async function () {
      await contract.connect(manufacturer).registerProduct(
        SKU, PRODUCT.name, PRODUCT.brand, PRODUCT.category
      );
      await expect(
        contract.connect(manufacturer).registerProduct(
          SKU, PRODUCT.name, PRODUCT.brand, PRODUCT.category
        )
      ).to.be.revertedWithCustomError(contract, "ProductAlreadyExists");
    });

    it("Rejects empty SKU", async function () {
      await expect(
        contract.connect(manufacturer).registerProduct("", PRODUCT.name, PRODUCT.brand, PRODUCT.category)
      ).to.be.revertedWithCustomError(contract, "EmptyString");
    });

    it("Tracks product count correctly", async function () {
      expect(await contract.getProductTypeCount()).to.equal(0);
      await contract.connect(manufacturer).registerProduct(
        SKU, PRODUCT.name, PRODUCT.brand, PRODUCT.category
      );
      expect(await contract.getProductTypeCount()).to.equal(1);
    });
  });

  // ───────────────────────────────────────────────────────────
  // SECTION 3: Batch Registration
  // ───────────────────────────────────────────────────────────
  describe("3. Batch Registration", function () {
    beforeEach(async function () {
      await contract.connect(manufacturer).registerProduct(
        SKU, PRODUCT.name, PRODUCT.brand, PRODUCT.category
      );
    });

    it("Manufacturer can register a batch", async function () {
      await contract.connect(manufacturer).registerBatch(
        PID, BATCH_NUM, MFG_DATE, EXP_DATE, QUANTITY, PKG_TYPE
      );
      const b = await contract.getBatch(BID);
      expect(b.batchNumber).to.equal(BATCH_NUM);
      expect(b.quantity).to.equal(QUANTITY);
      expect(b.status).to.equal(Status.REGISTERED);
      expect(b.currentOwner).to.equal(manufacturer.address);
    });

    it("BatchRegistered event emitted with correct params", async function () {
      await expect(
        contract.connect(manufacturer).registerBatch(
          PID, BATCH_NUM, MFG_DATE, EXP_DATE, QUANTITY, PKG_TYPE
        )
      )
        .to.emit(contract, "BatchRegistered")
        .withArgs(BID, PID, BATCH_NUM, manufacturer.address, MFG_DATE, EXP_DATE, QUANTITY, anyValue);
    });

    it("Rejects batch for non-existent product type", async function () {
      const fakePID = ethers.randomBytes(32);
      await expect(
        contract.connect(manufacturer).registerBatch(
          fakePID, BATCH_NUM, MFG_DATE, EXP_DATE, QUANTITY, PKG_TYPE
        )
      ).to.be.revertedWithCustomError(contract, "ProductNotFound");
    });

    it("Prevents duplicate batch numbers", async function () {
      await contract.connect(manufacturer).registerBatch(
        PID, BATCH_NUM, MFG_DATE, EXP_DATE, QUANTITY, PKG_TYPE
      );
      await expect(
        contract.connect(manufacturer).registerBatch(
          PID, BATCH_NUM, MFG_DATE, EXP_DATE, QUANTITY, PKG_TYPE
        )
      ).to.be.revertedWithCustomError(contract, "BatchAlreadyExists");
    });

    it("Rejects expiry date before manufacturing date", async function () {
      await expect(
        contract.connect(manufacturer).registerBatch(
          PID, BATCH_NUM, EXP_DATE, MFG_DATE, QUANTITY, PKG_TYPE // swapped dates
        )
      ).to.be.revertedWithCustomError(contract, "InvalidTimestamp");
    });
  });

  // ───────────────────────────────────────────────────────────
  // SECTION 4: Unit Registration
  // ───────────────────────────────────────────────────────────
  describe("4. Unit Registration", function () {
    beforeEach(async function () {
      await contract.connect(manufacturer).registerProduct(
        SKU, PRODUCT.name, PRODUCT.brand, PRODUCT.category
      );
      await contract.connect(manufacturer).registerBatch(
        PID, BATCH_NUM, MFG_DATE, EXP_DATE, QUANTITY, PKG_TYPE
      );
    });

    it("Manufacturer can register a unit in a batch", async function () {
      await contract.connect(manufacturer).registerUnit(BID, SERIAL);
      const [u, recalled] = await contract.getUnit(UID);
      expect(u.unitSerial).to.equal(SERIAL);
      expect(u.batchId).to.equal(BID);
      expect(recalled).to.be.false;
    });

    it("UnitRegistered event is emitted", async function () {
      await expect(contract.connect(manufacturer).registerUnit(BID, SERIAL))
        .to.emit(contract, "UnitRegistered")
        .withArgs(UID, BID, SERIAL, anyValue);
    });

    it("Prevents duplicate unit serial in same batch", async function () {
      await contract.connect(manufacturer).registerUnit(BID, SERIAL);
      await expect(contract.connect(manufacturer).registerUnit(BID, SERIAL))
        .to.be.revertedWithCustomError(contract, "UnitAlreadyExists");
    });

    it("getBatchUnits returns the unit", async function () {
      await contract.connect(manufacturer).registerUnit(BID, SERIAL);
      const units = await contract.getBatchUnits(BID);
      expect(units).to.include(UID);
      expect(units.length).to.equal(1);
    });
  });

  // ───────────────────────────────────────────────────────────
  // SECTION 5: Ownership Transfers (Experiment 1 & 2)
  // ───────────────────────────────────────────────────────────
  describe("5. Ownership Transfers", function () {
    beforeEach(async function () {
      await contract.connect(manufacturer).registerProduct(
        SKU, PRODUCT.name, PRODUCT.brand, PRODUCT.category
      );
      await contract.connect(manufacturer).registerBatch(
        PID, BATCH_NUM, MFG_DATE, EXP_DATE, QUANTITY, PKG_TYPE
      );
    });

    it("Manufacturer can transfer batch to distributor", async function () {
      await contract.connect(manufacturer).transferBatch(
        BID, distributor.address, "SHIP-001", Status.IN_TRANSIT
      );
      const b = await contract.getBatch(BID);
      expect(b.currentOwner).to.equal(distributor.address);
      expect(b.status).to.equal(Status.IN_TRANSIT);
    });

    it("OwnershipTransferred event emitted on batch transfer", async function () {
      await expect(
        contract.connect(manufacturer).transferBatch(
          BID, distributor.address, "SHIP-001", Status.IN_TRANSIT
        )
      )
        .to.emit(contract, "OwnershipTransferred")
        .withArgs(BID, true, manufacturer.address, distributor.address, "SHIP-001", anyValue);
    });

    it("StatusUpdated event emitted on transfer", async function () {
      await expect(
        contract.connect(manufacturer).transferBatch(
          BID, distributor.address, "SHIP-001", Status.IN_TRANSIT
        )
      )
        .to.emit(contract, "StatusUpdated")
        .withArgs(BID, true, Status.REGISTERED, Status.IN_TRANSIT, manufacturer.address, anyValue);
    });

    it("Transfer history is recorded correctly", async function () {
      await contract.connect(manufacturer).transferBatch(
        BID, distributor.address, "SHIP-001", Status.IN_TRANSIT
      );
      const history = await contract.getTransferHistory(BID);
      expect(history.length).to.equal(1);
      expect(history[0].from).to.equal(manufacturer.address);
      expect(history[0].to).to.equal(distributor.address);
      expect(history[0].shipmentRef).to.equal("SHIP-001");
    });

    it("Non-owner cannot transfer a batch", async function () {
      await expect(
        contract.connect(distributor).transferBatch(
          BID, warehouse.address, "SHIP-001", Status.IN_TRANSIT
        )
      ).to.be.revertedWithCustomError(contract, "NotCurrentOwner");
    });

    it("Full supply chain transfer: Manufacturer → Distributor → Warehouse → Retailer", async function () {
      // Step 1: Manufacturer → Distributor
      await contract.connect(manufacturer).transferBatch(
        BID, distributor.address, "SHIP-001", Status.IN_TRANSIT
      );

      // Step 2: Distributor → Warehouse
      await contract.connect(distributor).transferBatch(
        BID, warehouse.address, "SHIP-002", Status.RECEIVED
      );

      // Step 3: Warehouse → Retailer
      await contract.connect(warehouse).transferBatch(
        BID, retailer.address, "SHIP-003", Status.IN_TRANSIT
      );

      const b = await contract.getBatch(BID);
      expect(b.currentOwner).to.equal(retailer.address);

      const history = await contract.getTransferHistory(BID);
      expect(history.length).to.equal(3);
    });
  });

  // ───────────────────────────────────────────────────────────
  // SECTION 6: State Transitions (Experiment 1)
  // ───────────────────────────────────────────────────────────
  describe("6. State Transitions", function () {
    beforeEach(async function () {
      await contract.connect(manufacturer).registerProduct(
        SKU, PRODUCT.name, PRODUCT.brand, PRODUCT.category
      );
      await contract.connect(manufacturer).registerBatch(
        PID, BATCH_NUM, MFG_DATE, EXP_DATE, QUANTITY, PKG_TYPE
      );
    });

    it("REGISTERED → IN_TRANSIT: valid", async function () {
      await contract.connect(manufacturer).updateBatchStatus(BID, Status.IN_TRANSIT);
      expect((await contract.getBatch(BID)).status).to.equal(Status.IN_TRANSIT);
    });

    it("IN_TRANSIT → RECEIVED: valid", async function () {
      await contract.connect(manufacturer).transferBatch(
        BID, distributor.address, "", Status.IN_TRANSIT
      );
      await contract.connect(distributor).updateBatchStatus(BID, Status.RECEIVED);
      expect((await contract.getBatch(BID)).status).to.equal(Status.RECEIVED);
    });

    it("RECEIVED → IN_STOCK: valid", async function () {
      await contract.connect(manufacturer).transferBatch(
        BID, distributor.address, "", Status.IN_TRANSIT
      );
      await contract.connect(distributor).updateBatchStatus(BID, Status.RECEIVED);
      await contract.connect(distributor).updateBatchStatus(BID, Status.IN_STOCK);
      expect((await contract.getBatch(BID)).status).to.equal(Status.IN_STOCK);
    });

    it("IN_STOCK → SOLD: valid", async function () {
      await contract.connect(manufacturer).transferBatch(BID, retailer.address, "", Status.IN_STOCK);
      await contract.connect(retailer).updateBatchStatus(BID, Status.SOLD);
      expect((await contract.getBatch(BID)).status).to.equal(Status.SOLD);
    });

    it("REGISTERED → SOLD: INVALID - reverts with InvalidStatusTransition", async function () {
      await expect(
        contract.connect(manufacturer).updateBatchStatus(BID, Status.SOLD)
      ).to.be.revertedWithCustomError(contract, "InvalidStatusTransition");
    });

    it("IN_TRANSIT → SOLD: INVALID", async function () {
      await contract.connect(manufacturer).updateBatchStatus(BID, Status.IN_TRANSIT);
      await expect(
        contract.connect(manufacturer).updateBatchStatus(BID, Status.SOLD)
      ).to.be.revertedWithCustomError(contract, "InvalidStatusTransition");
    });

    it("RECALLED → IN_STOCK: INVALID (terminal state)", async function () {
      await contract.connect(manufacturer).recallBatch(BID, "Safety recall");
      await expect(
        contract.connect(manufacturer).updateBatchStatus(BID, Status.IN_STOCK)
      ).to.be.revertedWithCustomError(contract, "BatchIsRecalled");
    });

    it("DELIVERED is terminal - cannot transition to SOLD", async function () {
      await contract.connect(manufacturer).transferBatch(BID, retailer.address, "", Status.IN_STOCK);
      await contract.connect(retailer).updateBatchStatus(BID, Status.SOLD);
      await contract.connect(retailer).updateBatchStatus(BID, Status.DELIVERED);
      await expect(
        contract.connect(retailer).updateBatchStatus(BID, Status.SOLD)
      ).to.be.revertedWithCustomError(contract, "InvalidStatusTransition");
    });

    it("QUARANTINED → IN_STOCK: valid (cleared after inspection)", async function () {
      await contract.connect(manufacturer).updateBatchStatus(BID, Status.QUARANTINED);
      await contract.connect(manufacturer).updateBatchStatus(BID, Status.IN_STOCK);
      expect((await contract.getBatch(BID)).status).to.equal(Status.IN_STOCK);
    });
  });

  // ───────────────────────────────────────────────────────────
  // SECTION 7: Recall Management
  // ───────────────────────────────────────────────────────────
  describe("7. Recall Management", function () {
    beforeEach(async function () {
      await contract.connect(manufacturer).registerProduct(
        SKU, PRODUCT.name, PRODUCT.brand, PRODUCT.category
      );
      await contract.connect(manufacturer).registerBatch(
        PID, BATCH_NUM, MFG_DATE, EXP_DATE, QUANTITY, PKG_TYPE
      );
      await contract.connect(manufacturer).registerUnit(BID, SERIAL);
    });

    it("Manufacturer can recall their own batch", async function () {
      await contract.connect(manufacturer).recallBatch(BID, "Contamination detected");
      const b = await contract.getBatch(BID);
      expect(b.recalled).to.be.true;
      expect(b.recallReason).to.equal("Contamination detected");
      expect(b.status).to.equal(Status.RECALLED);
    });

    it("BatchRecalled event emitted with correct parameters", async function () {
      await expect(contract.connect(manufacturer).recallBatch(BID, "Safety concern"))
        .to.emit(contract, "BatchRecalled")
        .withArgs(BID, "Safety concern", manufacturer.address, anyValue);
    });

    it("Admin can recall any batch", async function () {
      await contract.connect(admin).recallBatch(BID, "Regulatory order");
      expect((await contract.getBatch(BID)).recalled).to.be.true;
    });

    it("Distributor cannot recall a batch they don't own", async function () {
      await expect(
        contract.connect(distributor).recallBatch(BID, "Unauthorized recall")
      ).to.be.revertedWithCustomError(contract, "UnauthorizedRole");
    });

    it("Units inherit recalled status from parent batch", async function () {
      await contract.connect(manufacturer).recallBatch(BID, "Contamination");
      const effectiveStatus = await contract.getEffectiveUnitStatus(UID);
      expect(effectiveStatus).to.equal(Status.RECALLED);
    });

    it("getUnit returns parentRecalled=true for units in recalled batch", async function () {
      await contract.connect(manufacturer).recallBatch(BID, "Recall reason");
      const [, recalled] = await contract.getUnit(UID);
      expect(recalled).to.be.true;
    });

    it("Cannot transfer a recalled batch", async function () {
      await contract.connect(manufacturer).recallBatch(BID, "Safety recall");
      await expect(
        contract.connect(manufacturer).transferBatch(
          BID, distributor.address, "", Status.IN_TRANSIT
        )
      ).to.be.revertedWithCustomError(contract, "BatchIsRecalled");
    });

    it("Cannot register new units in a recalled batch", async function () {
      await contract.connect(manufacturer).recallBatch(BID, "Safety recall");
      await expect(
        contract.connect(manufacturer).registerUnit(BID, "NEW-SERIAL")
      ).to.be.revertedWithCustomError(contract, "BatchIsRecalled");
    });
  });

  // ───────────────────────────────────────────────────────────
  // SECTION 8: Transaction Auditing (Experiment 3)
  // ───────────────────────────────────────────────────────────
  describe("8. Transaction Auditing", function () {
    it("Transfer history tracks all supply chain hops", async function () {
      await contract.connect(manufacturer).registerProduct(
        SKU, PRODUCT.name, PRODUCT.brand, PRODUCT.category
      );
      await contract.connect(manufacturer).registerBatch(
        PID, BATCH_NUM, MFG_DATE, EXP_DATE, QUANTITY, PKG_TYPE
      );

      await contract.connect(manufacturer).transferBatch(
        BID, distributor.address, "SHIP-A1", Status.IN_TRANSIT
      );
      await contract.connect(distributor).transferBatch(
        BID, warehouse.address, "SHIP-B1", Status.RECEIVED
      );
      await contract.connect(warehouse).transferBatch(
        BID, retailer.address, "SHIP-C1", Status.IN_TRANSIT
      );

      const history = await contract.getTransferHistory(BID);
      expect(history.length).to.equal(3);
      expect(history[0].from).to.equal(manufacturer.address);
      expect(history[0].to).to.equal(distributor.address);
      expect(history[1].from).to.equal(distributor.address);
      expect(history[1].to).to.equal(warehouse.address);
      expect(history[2].from).to.equal(warehouse.address);
      expect(history[2].to).to.equal(retailer.address);
    });

    it("Events are queryable as proof of completed transitions", async function () {
      await contract.connect(manufacturer).registerProduct(
        SKU, PRODUCT.name, PRODUCT.brand, PRODUCT.category
      );
      await contract.connect(manufacturer).registerBatch(
        PID, BATCH_NUM, MFG_DATE, EXP_DATE, QUANTITY, PKG_TYPE
      );

      const tx = await contract.connect(manufacturer).transferBatch(
        BID, distributor.address, "SHIP-001", Status.IN_TRANSIT
      );
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1); // 1 = confirmed
      expect(receipt?.hash).to.be.a("string").with.length(66); // valid tx hash
    });
  });

  // ───────────────────────────────────────────────────────────
  // SECTION 9: Integration - Full Product Journey
  // ───────────────────────────────────────────────────────────
  describe("9. Integration: Full Product Journey", function () {
    it("Tracks a product from manufacturer to customer", async function () {
      // 1. Register product type
      await contract.connect(manufacturer).registerProduct(
        SKU, PRODUCT.name, PRODUCT.brand, PRODUCT.category
      );

      // 2. Register batch
      await contract.connect(manufacturer).registerBatch(
        PID, BATCH_NUM, MFG_DATE, EXP_DATE, QUANTITY, PKG_TYPE
      );

      // 3. Register individual unit
      await contract.connect(manufacturer).registerUnit(BID, SERIAL);

      // 4. Manufacturer → Distributor
      await contract.connect(manufacturer).transferBatch(
        BID, distributor.address, "SHIP-001", Status.IN_TRANSIT
      );

      // 5. Distributor receives → Warehouse
      await contract.connect(distributor).transferBatch(
        BID, warehouse.address, "SHIP-002", Status.RECEIVED
      );

      // 6. Warehouse → Retailer
      await contract.connect(warehouse).transferBatch(
        BID, retailer.address, "SHIP-003", Status.IN_TRANSIT
      );

      // 7. Retailer marks as in-stock
      await contract.connect(retailer).updateBatchStatus(BID, Status.RECEIVED);
      await contract.connect(retailer).updateBatchStatus(BID, Status.IN_STOCK);

      // 8. Customer verifies the unit (read-only)
      const [unit, recalled] = await contract.getUnit(UID);
      expect(recalled).to.be.false;
      expect(unit.batchId).to.equal(BID);

      // 9. Retailer sells the batch
      await contract.connect(retailer).updateBatchStatus(BID, Status.SOLD);

      // Verify final state
      const finalBatch = await contract.getBatch(BID);
      expect(finalBatch.currentOwner).to.equal(retailer.address);
      expect(finalBatch.status).to.equal(Status.SOLD);

      // Full history should have 3 transfer records
      const history = await contract.getTransferHistory(BID);
      expect(history.length).to.equal(3);
    });
  });
});
