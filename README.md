# FMCG Blockchain Supply Chain Tracking System

An end-to-end decentralized tracking and provenance platform for Fast-Moving Consumer Goods (packaged food and beverages), securing accountability from factory production lines to everyday consumers.

Designed with a high-fidelity **Maritime Navigator & Cartographer** visual aesthetic (inspired by the tactical, navigational ambiance of Assassin's Creed: Black Flag — brass-gold compass accents, parchment tones, and deep nautical navy styling, delivered in an executive, accessible, enterprise interface).

---

## 1. Project Title
**FMCG Supply Chain Tracking System with Hybrid Ethereum Blockchain Traceability**

---

## 2. What the Project Does
This system gives every packaged food and beverage product a verifiable digital passport. It tracks:
1. **Production Batches:** Large manufacturing lots (e.g., 10,000 bottles of iced tea produced on May 10th).
2. **Individual Units:** Each specific carton, bottle, or packet inside that batch with its own unique serial number and QR code.

Whenever goods change hands—from the manufacturer who brews and packs them, to the logistics truck, to the central cold warehouse, to the retail grocery shelf, and finally into the shopper's cart—the transfer is permanently verified and recorded.

Anyone with a smartphone can scan a product's QR code in a store and immediately see its full authentic journey, check if it is fresh, or receive an immediate alert if that batch was recalled for safety.

---

## 3. The Real-World Problem It Solves

Traditional supply chains suffer from critical real-world vulnerabilities:
- **Siloed Records:** Every logistics firm and distributor keeps private spreadsheets or databases. When food spoilage occurs, companies waste weeks trying to find out where the bad batch went.
- **Slow Safety Recalls:** If a batch of baby food or beverages has an allergen defect or contamination, standard supply chains take days or weeks to notify stores. With our system, a single authorized recall instantly flags every individual bottle and alerts retailers and consumers.
- **Counterfeit Products & Re-labeling:** Dishonest actors slap authentic labels onto substandard goods. Our system links physical serial numbers to cryptographic records.
- **Expired Stock on Shelves:** Retailers often fail to rotate stock. The system includes automatic countdown alerts for goods nearing expiration (30-day radar).
- **Physical Limitation Honesty (The Oracle Reality):** Blockchain guarantees that recorded events cannot be secretly altered or deleted. However, a blockchain cannot physically stop a counterfeiter from printing a duplicate QR sticker. Our system clearly discloses this boundary to users and auditors.

---

## 4. Simple Example: Journey of a Bottle of Juice

Here is how a real product moves through the system:

```
  [1. Elena (Manufacturer)]
       │  Registers Product SKU & Produces Batch #OJ-2026-001 (5,000 bottles)
       │  Status: REGISTERED
       ▼
  [2. Handover to Marcus (Distributor)]
       │  Shipment dispatched with Waybill #BOL-9901
       │  Status: IN_TRANSIT
       ▼
  [3. Sarah (Warehouse Hub Manager)]
       │  Receives goods at Central Hub #4, conducts cold-room inspection
       │  Status: RECEIVED ➔ IN_STOCK
       ▼
  [4. Rajesh (Metro Supermarket Retailer)]
       │  Accepts stock onto supermarket display shelves
       │  Status: IN_STOCK
       ▼
  [5. Alice (Shopper / Customer)]
       │  Scans QR code on bottle #OJ-2026-001-B72 with smartphone
       │  Verifies factory date, expiry, genuine batch, and 0 active recalls!
       ▼
  [6. Cashier Checkout]
       │  Item marked as SOLD / DELIVERED (Terminal state)
```

---

## 5. Main Features

- 📋 **SKU & Product Registration:** Register standardized product types (Brand, Category, Ingredients, Packaging).
- 📦 **Dual-Level Tracking:** Seamless batch tracking (thousands of units) and individual serialized unit tracking.
- ⚓ **Authorized Custody Transfers:** Cryptographic handover where only the recorded current owner can transfer cargo.
- 🔄 **Strict State Machine:** Lifecycle rules prevent illegal leaps (e.g. goods cannot be marked "SOLD" while still in transit on a cargo ship).
- ☠️ **Instant Recall Propagation:** Recalling a parent batch automatically flags all individual units within it.
- ⏳ **Expiry & Peril Monitoring:** Visual countdown radar highlighting items approaching best-before dates.
- 🔍 **Zero-Wallet Consumer Verification:** Customers scan QR codes and inspect verification pages without needing MetaMask, cryptocurrency, or blockchain knowledge.
- 🔗 **Transaction Audit Explorer:** Searchable, paginated audit trail matching off-chain events to on-chain transaction hashes.
- 🎭 **Built-in Persona Switcher:** Switch between Manufacturer, Distributor, Warehouse, Retailer, and Admin in one click to test multi-party handovers.

---

## 6. How Blockchain Helps

| Feature | Without Blockchain | With Blockchain |
|---|---|---|
| **Record Editing** | A database admin or rogue employee can alter dates or delete records | Impossible: Ethereum transaction logs are cryptographically immutable |
| **Audit Trail** | Companies can claim "we shipped it on time" without proof | Verifiable timestamps and digital signatures from sender and receiver |
| **Recall Authority** | Ambiguity over who authorized a product recall | Only verified manufacturer or system admin wallets can issue a valid recall |
| **Trust Between Rivals** | Distributors and retailers do not trust each other's private databases | All parties share the same transparent truth ledger |

---

## 7. Technologies Used (In One Line Each)

- **Solidity (`^0.8.20`):** The smart contract programming language used to code immutable business rules and state machines.
- **Hardhat:** The Ethereum developer environment used to compile, test, and deploy smart contracts.
- **OpenZeppelin Contracts:** Industry-standard, audited smart contract security libraries for Access Control and Reentrancy protection.
- **Ethers.js (`v6`):** The Web3 client library that allows JavaScript/TypeScript code to talk to the Ethereum blockchain.
- **Node.js & Express:** The backend server handling REST API requests, off-chain indexing, and QR generation.
- **Node built-in SQLite (WAL mode):** Fast, zero-configuration local database that caches fast searches without overriding blockchain truth.
- **React 18 & TypeScript:** The user interface framework ensuring type-safe, component-driven frontend architecture.
- **Vite:** Next-generation frontend build tool providing near-instant hot module reloading and optimized production bundles.
- **Tailwind CSS:** Utility-first CSS engine powering the bespoke Assassin's Creed Black Flag navigational cartography theme.
- **QRCode.react & node-qrcode:** High-resolution SVG/PNG 2D barcode generator for product scanning.

---

## 8. How Frontend, Backend, Database & Blockchain Work Together

```
                  ┌──────────────────────────────────────────────┐
                  │          React Frontend (Vite)               │
                  │   - Tactical Cartographic UI                 │
                  │   - Active Persona Role Switcher             │
                  │   - Public QR Verification Scanner           │
                  └───────────────┬──────────────────────────────┘
                                  │
                   REST Calls /   │     Web3 / Ethers.js
                   JSON Payloads  │     Direct Smart Contract Calls
                                  │
                  ┌───────────────▼──────────────┐        ┌───────────────────────────────┐
                  │     Express REST API         │        │    Ethereum Blockchain        │
                  │   - Input Validation         │        │    (Sepolia / Hardhat Node)   │
                  │   - QR PNG Streaming         │        │                               │
                  │   - High-Speed Query Engine  │        │  - FMCGSupplyChain.sol        │
                  └───────────────┬──────────────┘        │  - Role Access Control        │
                                  │                       │  - State Machine Logic        │
                                  ▼                       │  - Event Log Immutability     │
                  ┌──────────────────────────────┐        └───────────────────────────────┘
                  │      SQLite Database         │
                  │   - Product Metadata Cache   │
                  │   - Audit Trail & Logs       │
                  │   - Fast Search & Filter     │
                  └──────────────────────────────┘
```

1. **Write Operations:** When a manufacturer creates a batch or transfers custody, the transaction is submitted to the **Solidity smart contract**.
2. **Event Emission:** The smart contract validates rules, executes state changes, and emits indexed events (`BatchRegistered`, `OwnershipTransferred`, `BatchRecalled`).
3. **Off-Chain Mirroring:** The backend records verified operational metadata (descriptions, shipment references, actor names) in the SQLite database for instant full-text search.
4. **Read Operations:** End consumers and dashboard viewers query the fast backend API for instantaneous rendering, with direct links to the Sepolia Etherscan explorer for verification.

---

## 9. Project Folder Structure

```
Blockchain Project/
├── blockchain/                      # Smart Contract Subsystem
│   ├── contracts/
│   │   └── FMCGSupplyChain.sol      # Core Smart Contract (Access, Batches, Units, Recalls)
│   ├── scripts/
│   │   └── deploy.ts                # Sepolia & Local EVM Deployment Script
│   ├── test/
│   │   └── FMCGSupplyChain.test.ts  # Hardhat Test Suite (47 automated tests)
│   ├── hardhat.config.js            # Hardhat Compiler & Network Config
│   └── package.json                 # Blockchain Dependencies
│
├── backend/                         # Server & API Subsystem
│   ├── src/
│   │   ├── database/
│   │   │   ├── connection.js        # SQLite Schema & Connection (WAL mode)
│   │   │   └── seed.js              # Comprehensive Demo Data Generator
│   │   ├── routes/                  # Express REST Route Handlers
│   │   │   ├── products.js          # SKU Registry
│   │   │   ├── batches.js           # Production Batches & Status Updates
│   │   │   ├── units.js             # Serialized Unit Ledger
│   │   │   ├── transfers.js         # Custody Handover Logging
│   │   │   ├── verify.js            # Public QR Verification & Stream
│   │   │   ├── audit.js             # Tamper-Evident Audit Trails
│   │   │   ├── participants.js      # Supply Chain Actor Profiles
│   │   │   └── dashboard.js         # Summary Metrics & Alerts
│   │   └── index.js                 # API Entrypoint (Port 3001)
│   ├── tests/
│   │   └── api.test.js              # Automated Backend In-Memory Tests (11 tests)
│   └── package.json
│
├── frontend/                        # Web Application Subsystem
│   ├── src/
│   │   ├── components/layout/       # App Shell, Sidebar & Navigation
│   │   ├── contexts/
│   │   │   └── WalletContext.tsx    # MetaMask & Multi-Persona Role Switcher
│   │   ├── pages/                   # All 15 Required Application Views
│   │   │   ├── Landing.tsx          # Public Port of Entry
│   │   │   ├── Dashboard.tsx        # Captain's Log (Executive Metrics)
│   │   │   ├── Products.tsx         # SKU Cargo Registry
│   │   │   ├── Batches.tsx          # Batch Manifest
│   │   │   ├── BatchDetail.tsx      # Comprehensive Batch Profile & QR Frame
│   │   │   ├── Units.tsx            # Serialized Unit Ledger
│   │   │   ├── Transfers.tsx        # Transfer Crew & Voyage History
│   │   │   ├── ExpiryRecall.tsx     # Peril & Recall Center
│   │   │   ├── Verify.tsx           # Public Consumer Verification Page
│   │   │   ├── Audit.tsx            # Transaction Audit Explorer
│   │   │   ├── Participants.tsx     # Crew Register
│   │   │   └── Settings.tsx         # Helm & Network System Configuration
│   │   ├── services/api.ts          # Axios API Client
│   │   ├── utils/helpers.ts         # Formatting, Dates, and State Badges
│   │   ├── index.css                # Black Flag Cartographic Theme Styles
│   │   └── App.tsx                  # Client-Side Routing
│   ├── vite.config.ts
│   └── package.json
│
├── package.json                     # Root Workspace Orchestration
├── .env.example                     # Environment Template
└── README.md                        # Master Documentation & Viva Guide
```

---

## 10. Setup and Installation Instructions

### Prerequisites
- **Node.js** version 20 or higher installed (`node -v`)
- **Git** installed

### Step-by-Step Setup
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd "Blockchain Project"
   ```

2. **Install dependencies:**
   ```bash
   # Install root, backend, blockchain, and frontend dependencies
   cd backend && npm install
   cd ../blockchain && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   *(For local testing, defaults work automatically without filling external API keys).*

4. **Seed Realistic Demo Data:**
   ```bash
   npm run seed
   ```

5. **Start the Development Servers:**
   Open two terminal windows:
   ```bash
   # Terminal 1: Backend API (runs on http://localhost:3001)
   npm run start:backend

   # Terminal 2: Frontend UI (runs on http://localhost:5173)
   npm run start:frontend
   ```
   Open **http://localhost:5173** in your browser!

---

## 11. How to Run Automated Tests

The project includes 100% automated test suites across both smart contracts and API endpoints:

```bash
# Run All Tests (47 Smart Contract Tests + 11 Backend API Tests)
npm test

# Run ONLY Smart Contract Tests
npm run test:contracts

# Run ONLY Backend API Tests
npm run test:backend
```

### Verified Test Outputs:
- **`blockchain`**: 47 passing tests (0 failures). Tests role access control, duplicate SKU/batch rejection, custody transfers, strict state machine transitions, recall propagation, and complete supply chain journey integration.
- **`backend`**: 11 passing in-memory tests (0 failures). Tests all REST endpoints, pagination, QR generation, status updates, and audit logging.

---

## 12. Step-by-Step User Guide (All Roles)

### A. Testing Without MetaMask (Instant Demo Mode)
Look at the sidebar under the logo. The **Active Persona** selector lets you switch between:
- 🏭 **Elena (Manufacturer):** Can register products, create batches, serialize units, and trigger recalls.
- 🚚 **Marcus (Distributor):** Can accept shipments and transfer cargo onward.
- 🏢 **Sarah (Warehouse):** Can accept inventory and store in warehouse stock.
- 🏪 **Rajesh (Retailer):** Can receive stock, place items on shelves, and record customer sales.
- 👑 **System Admin:** Can manage crew roles and issue global emergency recalls.

### B. Performing a Full Product Journey:
1. **Switch to Elena (Manufacturer):**
   - Go to **Product Registry** (`/products`) → Click `⊕ Register Product`.
   - Enter a new SKU (e.g., `MANGO-JUICE-1L`), Name, and Brand.
   - Go to **Batch Manifest** (`/batches`) → Click `⊕ Register Batch`.
   - Select your product, enter Batch Number `MJ-2026-001`, Manufacturing Date, Expiry Date, and Quantity.
2. **Transfer to Distributor:**
   - Go to **Transfer Crew** (`/transfers`) → Click `⊕ Initiate Transfer`.
   - Select Batch `MJ-2026-001`, choose Marcus (Distributor), enter Waybill `WAY-7701`, and set status to `IN_TRANSIT`.
3. **Switch to Marcus (Distributor) & Forward to Warehouse:**
   - Forward cargo to Sarah (Warehouse Hub #4) with status `RECEIVED` or `IN_STOCK`.
4. **Public Customer Verification:**
   - Open **Batch Manifest** → Click on the batch → View the interactive **QR Code**.
   - Click `🔍 Open Verify Page` (`/verify/:id`).
   - Notice the complete immutable journey, genuine product certificate, and the food safety disclaimer!
5. **Simulate a Safety Recall:**
   - Switch back to Elena (Manufacturer).
   - Go to **Peril & Recall** (`/expiry`) or open the batch details.
   - Click `☠️ Recall Batch` → Enter reason: *"Packaging seal defect on line 2B"*.
   - Re-visit the public verification page: it now prominently flashes a red **RECALLED — DO NOT CONSUME** warning!

---

## 13. Experiments & College Viva / Interview Q&A

This section is prepared specifically for college viva presentations, project defenses, and technical interviews.

### The 3 Core Experiments Explained

#### Experiment 1: Finite State Machine & State Transitions
- **Goal:** Prove that the smart contract strictly enforces legal physical progression and prevents impossible real-world states.
- **State Flow:**
  $$\text{REGISTERED} \longrightarrow \text{IN\_TRANSIT} \longrightarrow \text{RECEIVED} \longrightarrow \text{IN\_STOCK} \longrightarrow \text{SOLD} \longrightarrow \text{DELIVERED}$$
- **Terminal States:** `RECALLED`, `DAMAGED`, `EXPIRED`, and `DELIVERED` are terminal. Once a batch is recalled or expired, the smart contract throws `InvalidStatusTransition` or `BatchIsRecalled` if anyone attempts to sell or stock it.
- **Test Proof:** See test suite Section 6 in [`FMCGSupplyChain.test.ts`](file:///c:/Users/ADMIN/Desktop/Blockchain%20Project/blockchain/test/FMCGSupplyChain.test.ts) (Tests passing: *REGISTERED → SOLD is REVERTED*, *IN_TRANSIT → SOLD is REVERTED*, *RECALLED → IN_STOCK is REVERTED*).

#### Experiment 2: Smart Contract Event Emissions
- **Goal:** Prove that state transitions generate immutable on-chain logs queryable by external clients and blockchain indexers.
- **Key Events:**
  - `ProductRegistered(bytes32 id, string name, string skuCode, address manufacturer, uint256 timestamp)`
  - `BatchRegistered(bytes32 id, bytes32 productTypeId, string batchNumber, address manufacturer, ...)`
  - `OwnershipTransferred(bytes32 itemId, bool isBatch, address from, address to, string shipmentRef, uint256 timestamp)`
  - `BatchRecalled(bytes32 batchId, string reason, address recalledBy, uint256 timestamp)`
- **Test Proof:** See test suite Section 2, 3, 5, 7. Ethers.js `.to.emit(contract, "EventName").withArgs(...)` validates exact parameter matching.

#### Experiment 3: Transaction Auditing & Verifiable Provenance
- **Goal:** Prove that off-chain database records can be audited against cryptographic proof on Ethereum.
- **Implementation:** Every batch transfer stores the Ethereum transaction hash (`tx_hash`) and block number (`block_number`). The audit page links directly to the public Sepolia Etherscan block explorer (`https://sepolia.etherscan.io/tx/0x...`).

---

### Top 10 Viva / Interview Questions & Answers

**Q1: Why use Ethereum for FMCG supply chains instead of a standard MySQL database?**
> *Answer:* A traditional database has a central administrator who can edit, backdate, or delete records to cover up negligence (such as shipping expired food). With Ethereum, records are signed with cryptographic private keys and cannot be modified once written. It creates trust between competing organizations (manufacturers, distributors, retailers) who do not trust each other's internal databases.

**Q2: What is the "Oracle Problem" in supply chain blockchain, and how does your project address it?**
> *Answer:* The Oracle Problem states that a blockchain can guarantee that data hasn't been changed once on-chain, but it cannot verify if the data entered was true in the physical world. For example, if a bad actor prints a copied QR code on counterfeit packaging, the blockchain will say the QR code is valid. Our application openly discloses this in the UI and documentation, explaining that blockchain provides digital provenance, not physical sensory proof.

**Q3: How does your system track individual units without making blockchain gas costs astronomical?**
> *Answer:* We use a hybrid architecture. The high-level product definition and production batches (which represent thousands of items) are anchored on-chain with full state machine controls. Individual serialized units are linked to the parent batch via cryptographic identifiers ($UID = \text{keccak256}(\text{serial}, \text{batchId})$). When a batch is recalled, all units inherit the recall status automatically without needing thousands of separate expensive transactions.

**Q4: What happens if an unauthorized distributor tries to transfer a batch?**
> *Answer:* The smart contract has strict ownership checks: `if (batch.currentOwner != msg.sender) revert NotCurrentOwner(...)`. Even if someone hacks the frontend or database, the transaction will revert on the Ethereum Virtual Machine (EVM).

**Q5: What are custom errors in Solidity 0.8.20 and why did you use them over `require(condition, "error message")`?**
> *Answer:* Custom errors (like `error InvalidStatusTransition(Status current, Status next)`) are much cheaper in gas than long string revert messages. Strings require memory allocation and ABI encoding overhead; custom errors only use a 4-byte selector plus arguments, saving thousands of gas units per transaction.

**Q6: What roles are defined in the system and how are permissions enforced?**
> *Answer:* We use OpenZeppelin's `AccessControl` with 5 roles: `DEFAULT_ADMIN_ROLE`, `MANUFACTURER_ROLE`, `DISTRIBUTOR_ROLE`, `WAREHOUSE_ROLE`, and `RETAILER_ROLE`. Only manufacturers can register products; only current owners can transfer goods; only admins or the original manufacturer can issue a batch recall.

**Q7: How does an end customer verify a product in a grocery store?**
> *Answer:* The customer does not need a crypto wallet, gas money, or Web3 knowledge. They simply scan the QR code with their standard mobile camera. This opens `/verify/:id` which queries the immutable verification record, displays manufacturing and expiry dates, shows full journey hops, and alerts if there is an active recall.

**Q8: What is SQLite WAL mode used in the backend?**
> *Answer:* WAL stands for Write-Ahead Logging. In standard SQLite, writes lock the entire database file preventing concurrent reads. WAL mode allows multiple readers to read simultaneously while a write transaction is occurring, providing enterprise-grade speed and reliability for our REST API cache.

**Q9: Why does the UI follow a maritime cartographer aesthetic (Assassin's Creed Black Flag style)?**
> *Answer:* FMCG logistics is historically and practically about fleet management, voyages, manifests, and peril tracking. The navigational cartography design (compass coordinate badges, brass gold accents, clean dark navy ocean palettes, and serif headers) makes enterprise tracking visually distinctive and intuitive, while maintaining modern usability, readable contrast, and data density.

**Q10: How can this system be deployed to the live Ethereum Sepolia testnet?**
> *Answer:* In `blockchain/hardhat.config.js`, configure `networks.sepolia` with your Alchemy/Infura RPC URL and deployer private key. Then run `npx hardhat run scripts/deploy.ts --network sepolia`. The script deploys `FMCGSupplyChain.sol`, writes the contract address and ABI to `blockchain/deployments/sepolia.json`, and outputs the Etherscan verification link.
