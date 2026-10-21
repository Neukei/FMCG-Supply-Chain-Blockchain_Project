// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FMCGSupplyChain
 * @dev Core smart contract for FMCG product tracking from manufacturer to customer.
 *
 * ARCHITECTURE:
 * - ProductType: A product SKU/definition (e.g., "Coca-Cola 500ml")
 * - Batch:       A production run of a product (e.g., Batch #LC-2024-001, 10,000 units)
 * - Unit:        An individual packaged item within a batch (e.g., one bottle)
 *
 * ROLES:
 * - DEFAULT_ADMIN_ROLE: Deploy admin, can grant/revoke all roles
 * - MANUFACTURER_ROLE:  Register products, batches, units
 * - DISTRIBUTOR_ROLE:   Receive & forward shipments
 * - WAREHOUSE_ROLE:     Accept custody, store, dispatch
 * - RETAILER_ROLE:      Receive, sell products
 *
 * LIMITATIONS (important, read before using):
 * - This contract records what participants REPORT. It cannot verify whether
 *   the physical product, dates, or identities are genuine.
 * - A copied QR code on a counterfeit product will pass verification.
 * - Expiry and manufacturing dates are only as reliable as the data entered.
 */
contract FMCGSupplyChain is AccessControl, ReentrancyGuard {

    // =========================================================
    // ROLES
    // =========================================================
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE  = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant WAREHOUSE_ROLE    = keccak256("WAREHOUSE_ROLE");
    bytes32 public constant RETAILER_ROLE     = keccak256("RETAILER_ROLE");

    // =========================================================
    // LIFECYCLE STATES
    // =========================================================
    enum Status {
        REGISTERED,   // 0 - Newly created, not yet shipped
        IN_TRANSIT,   // 1 - Shipped, in transit
        RECEIVED,     // 2 - Received at destination
        IN_STOCK,     // 3 - Stored in warehouse/retail
        SOLD,         // 4 - Sold to end customer
        DELIVERED,    // 5 - Delivered to customer
        QUARANTINED,  // 6 - Held pending investigation
        RECALLED,     // 7 - Officially recalled
        DAMAGED,      // 8 - Confirmed damaged
        EXPIRED       // 9 - Past expiry date
    }

    // =========================================================
    // DATA STRUCTURES
    // =========================================================

    struct ProductType {
        bytes32 id;
        string  name;
        string  brand;
        string  category;
        string  skuCode;          // Unique SKU identifier
        address manufacturer;
        uint256 registeredAt;
        bool    exists;
    }

    struct Batch {
        bytes32 id;
        bytes32 productTypeId;   // Parent product type
        string  batchNumber;     // Human-readable batch number (e.g., "LC-2024-001")
        address manufacturer;
        uint256 manufacturingDate;
        uint256 expiryDate;      // 0 = no expiry (e.g., non-perishable)
        uint256 quantity;        // Total units in this batch
        string  packagingType;
        address currentOwner;
        Status  status;
        uint256 registeredAt;
        bool    recalled;
        string  recallReason;
        bool    exists;
    }

    struct Unit {
        bytes32 id;
        bytes32 batchId;         // Parent batch
        string  unitSerial;      // Unique serial within batch
        address currentOwner;
        Status  status;          // Inherits batch recall if batch is RECALLED
        uint256 registeredAt;
        bool    exists;
    }

    struct TransferRecord {
        bytes32 itemId;
        bool    isBatch;         // true = batch transfer, false = unit transfer
        address from;
        address to;
        uint256 timestamp;
        string  shipmentRef;     // Optional shipment reference
        Status  statusAfter;     // Status set on the item after transfer
    }

    // =========================================================
    // STORAGE
    // =========================================================
    mapping(bytes32 => ProductType)     public productTypes;
    mapping(bytes32 => Batch)           public batches;
    mapping(bytes32 => Unit)            public units;
    mapping(bytes32 => bytes32[])       public batchUnits;    // batchId => unitIds[]
    mapping(bytes32 => TransferRecord[]) public transferHistory; // itemId => transfers[]

    bytes32[] public allProductTypeIds;
    bytes32[] public allBatchIds;
    bytes32[] public allUnitIds;

    // =========================================================
    // EVENTS
    // =========================================================
    event ProductRegistered(
        bytes32 indexed productId,
        string  name,
        string  skuCode,
        address indexed manufacturer,
        uint256 timestamp
    );

    event BatchRegistered(
        bytes32 indexed batchId,
        bytes32 indexed productTypeId,
        string  batchNumber,
        address indexed manufacturer,
        uint256 manufacturingDate,
        uint256 expiryDate,
        uint256 quantity,
        uint256 timestamp
    );

    event UnitRegistered(
        bytes32 indexed unitId,
        bytes32 indexed batchId,
        string  unitSerial,
        uint256 timestamp
    );

    event OwnershipTransferred(
        bytes32 indexed itemId,
        bool    isBatch,
        address indexed from,
        address indexed to,
        string  shipmentRef,
        uint256 timestamp
    );

    event StatusUpdated(
        bytes32 indexed itemId,
        bool    isBatch,
        Status  oldStatus,
        Status  newStatus,
        address indexed updatedBy,
        uint256 timestamp
    );

    event BatchRecalled(
        bytes32 indexed batchId,
        string  reason,
        address indexed initiatedBy,
        uint256 timestamp
    );

    event RoleAssigned(
        address indexed account,
        bytes32 indexed role,
        address indexed assignedBy
    );

    // =========================================================
    // CUSTOM ERRORS (gas-efficient alternative to require strings)
    // =========================================================
    error ProductAlreadyExists(bytes32 productId);
    error BatchAlreadyExists(bytes32 batchId);
    error UnitAlreadyExists(bytes32 unitId);
    error ProductNotFound(bytes32 productId);
    error BatchNotFound(bytes32 batchId);
    error UnitNotFound(bytes32 unitId);
    error NotCurrentOwner(bytes32 itemId, address caller);
    error InvalidStatusTransition(Status current, Status next);
    error BatchIsRecalled(bytes32 batchId);
    error UnauthorizedRole(address caller, bytes32 requiredRole);
    error InvalidAddress(string field);
    error InvalidTimestamp(string field);
    error EmptyString(string field);

    // =========================================================
    // CONSTRUCTOR
    // =========================================================
    constructor(address adminAddress) {
        if (adminAddress == address(0)) revert InvalidAddress("adminAddress");
        _grantRole(DEFAULT_ADMIN_ROLE, adminAddress);
        _grantRole(MANUFACTURER_ROLE,  adminAddress); // Admin can also act as manufacturer
    }

    // =========================================================
    // MODIFIERS
    // =========================================================
    modifier batchExists(bytes32 batchId) {
        if (!batches[batchId].exists) revert BatchNotFound(batchId);
        _;
    }

    modifier unitExists(bytes32 unitId) {
        if (!units[unitId].exists) revert UnitNotFound(unitId);
        _;
    }

    modifier notRecalled(bytes32 batchId) {
        if (batches[batchId].recalled) revert BatchIsRecalled(batchId);
        _;
    }

    // =========================================================
    // ADMIN: ROLE MANAGEMENT
    // =========================================================

    /**
     * @dev Assign a named role to a supply chain participant.
     * Only the DEFAULT_ADMIN can call this.
     */
    function assignRole(address account, bytes32 role)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (account == address(0)) revert InvalidAddress("account");
        _grantRole(role, account);
        emit RoleAssigned(account, role, msg.sender);
    }

    /**
     * @dev Revoke a named role from a participant.
     */
    function revokeParticipantRole(address account, bytes32 role)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _revokeRole(role, account);
    }

    // =========================================================
    // MANUFACTURER: PRODUCT TYPE REGISTRATION
    // =========================================================

    /**
     * @dev Register a new product type (SKU).
     * A product type is the definition of a product, not a physical item.
     * E.g., "Coca-Cola 500ml Bottle" is a product type.
     *
     * @param skuCode   Unique SKU code (used as the on-chain key)
     * @param name      Product name
     * @param brand     Brand name
     * @param category  Product category (e.g., "Beverage", "Snack")
     */
    function registerProduct(
        string calldata skuCode,
        string calldata name,
        string calldata brand,
        string calldata category
    )
        external
        onlyRole(MANUFACTURER_ROLE)
        returns (bytes32 productId)
    {
        if (bytes(skuCode).length == 0)   revert EmptyString("skuCode");
        if (bytes(name).length == 0)      revert EmptyString("name");
        if (bytes(brand).length == 0)     revert EmptyString("brand");
        if (bytes(category).length == 0)  revert EmptyString("category");

        productId = keccak256(abi.encodePacked(skuCode, msg.sender));

        if (productTypes[productId].exists) revert ProductAlreadyExists(productId);

        productTypes[productId] = ProductType({
            id:           productId,
            name:         name,
            brand:        brand,
            category:     category,
            skuCode:      skuCode,
            manufacturer: msg.sender,
            registeredAt: block.timestamp,
            exists:       true
        });

        allProductTypeIds.push(productId);

        emit ProductRegistered(productId, name, skuCode, msg.sender, block.timestamp);
    }

    // =========================================================
    // MANUFACTURER: BATCH REGISTRATION
    // =========================================================

    /**
     * @dev Register a production batch of a product type.
     * A batch is a group of units produced together (e.g., 10,000 bottles).
     *
     * @param productTypeId    On-chain ID of the product type
     * @param batchNumber      Human-readable batch number (e.g., "LC-2024-001")
     * @param manufacturingDate Unix timestamp of manufacturing date
     * @param expiryDate        Unix timestamp of expiry date (0 = no expiry)
     * @param quantity          Number of individual units in this batch
     * @param packagingType     e.g., "Carton", "Pallet", "Case"
     */
    function registerBatch(
        bytes32 productTypeId,
        string  calldata batchNumber,
        uint256 manufacturingDate,
        uint256 expiryDate,
        uint256 quantity,
        string  calldata packagingType
    )
        external
        onlyRole(MANUFACTURER_ROLE)
        returns (bytes32 batchId)
    {
        if (!productTypes[productTypeId].exists) revert ProductNotFound(productTypeId);
        if (bytes(batchNumber).length == 0)      revert EmptyString("batchNumber");
        if (manufacturingDate == 0)              revert InvalidTimestamp("manufacturingDate");
        if (expiryDate != 0 && expiryDate <= manufacturingDate)
            revert InvalidTimestamp("expiryDate must be after manufacturingDate");
        if (quantity == 0)                       revert EmptyString("quantity must be > 0");

        batchId = keccak256(abi.encodePacked(batchNumber, productTypeId, msg.sender));

        if (batches[batchId].exists) revert BatchAlreadyExists(batchId);

        batches[batchId] = Batch({
            id:               batchId,
            productTypeId:    productTypeId,
            batchNumber:      batchNumber,
            manufacturer:     msg.sender,
            manufacturingDate:manufacturingDate,
            expiryDate:       expiryDate,
            quantity:         quantity,
            packagingType:    packagingType,
            currentOwner:     msg.sender,
            status:           Status.REGISTERED,
            registeredAt:     block.timestamp,
            recalled:         false,
            recallReason:     "",
            exists:           true
        });

        allBatchIds.push(batchId);

        emit BatchRegistered(
            batchId,
            productTypeId,
            batchNumber,
            msg.sender,
            manufacturingDate,
            expiryDate,
            quantity,
            block.timestamp
        );
    }

    // =========================================================
    // MANUFACTURER: UNIT REGISTRATION
    // =========================================================

    /**
     * @dev Register an individual unit within a batch.
     * Not all batches need individual unit tracking. Only register units
     * when per-unit traceability is required (e.g., high-value products).
     *
     * @param batchId    Parent batch ID
     * @param unitSerial Unique serial number for this unit
     */
    function registerUnit(
        bytes32 batchId,
        string  calldata unitSerial
    )
        external
        onlyRole(MANUFACTURER_ROLE)
        batchExists(batchId)
        notRecalled(batchId)
        returns (bytes32 unitId)
    {
        if (bytes(unitSerial).length == 0) revert EmptyString("unitSerial");

        unitId = keccak256(abi.encodePacked(unitSerial, batchId));

        if (units[unitId].exists) revert UnitAlreadyExists(unitId);

        units[unitId] = Unit({
            id:           unitId,
            batchId:      batchId,
            unitSerial:   unitSerial,
            currentOwner: batches[batchId].currentOwner,
            status:       Status.REGISTERED,
            registeredAt: block.timestamp,
            exists:       true
        });

        batchUnits[batchId].push(unitId);
        allUnitIds.push(unitId);

        emit UnitRegistered(unitId, batchId, unitSerial, block.timestamp);
    }

    // =========================================================
    // OWNERSHIP TRANSFER
    // =========================================================

    /**
     * @dev Transfer ownership of a batch to another supply chain participant.
     * The caller must be the current owner of the batch.
     * The recipient must hold at least one supply-chain role.
     *
     * @param batchId     Batch to transfer
     * @param to          Recipient address
     * @param shipmentRef Optional shipment reference (e.g., "SHIP-2024-555")
     * @param newStatus   Status to set on the batch (e.g., IN_TRANSIT)
     */
    function transferBatch(
        bytes32 batchId,
        address to,
        string  calldata shipmentRef,
        Status  newStatus
    )
        external
        nonReentrant
        batchExists(batchId)
        notRecalled(batchId)
    {
        Batch storage batch = batches[batchId];
        if (batch.currentOwner != msg.sender) revert NotCurrentOwner(batchId, msg.sender);
        if (to == address(0))                 revert InvalidAddress("to");
        _validateTransition(batch.status, newStatus);

        address oldOwner = batch.currentOwner;
        batch.currentOwner = to;
        Status oldStatus = batch.status;
        batch.status = newStatus;

        transferHistory[batchId].push(TransferRecord({
            itemId:      batchId,
            isBatch:     true,
            from:        oldOwner,
            to:          to,
            timestamp:   block.timestamp,
            shipmentRef: shipmentRef,
            statusAfter: newStatus
        }));

        emit OwnershipTransferred(batchId, true, oldOwner, to, shipmentRef, block.timestamp);
        emit StatusUpdated(batchId, true, oldStatus, newStatus, msg.sender, block.timestamp);
    }

    /**
     * @dev Transfer ownership of an individual unit.
     */
    function transferUnit(
        bytes32 unitId,
        address to,
        string  calldata shipmentRef,
        Status  newStatus
    )
        external
        nonReentrant
        unitExists(unitId)
    {
        Unit storage unit = units[unitId];
        // Check parent batch is not recalled
        if (batches[unit.batchId].recalled) revert BatchIsRecalled(unit.batchId);
        if (unit.currentOwner != msg.sender) revert NotCurrentOwner(unitId, msg.sender);
        if (to == address(0))               revert InvalidAddress("to");
        _validateTransition(unit.status, newStatus);

        address oldOwner = unit.currentOwner;
        unit.currentOwner = to;
        Status oldStatus = unit.status;
        unit.status = newStatus;

        transferHistory[unitId].push(TransferRecord({
            itemId:      unitId,
            isBatch:     false,
            from:        oldOwner,
            to:          to,
            timestamp:   block.timestamp,
            shipmentRef: shipmentRef,
            statusAfter: newStatus
        }));

        emit OwnershipTransferred(unitId, false, oldOwner, to, shipmentRef, block.timestamp);
        emit StatusUpdated(unitId, false, oldStatus, newStatus, msg.sender, block.timestamp);
    }

    // =========================================================
    // STATUS MANAGEMENT
    // =========================================================

    /**
     * @dev Update the status of a batch (current owner only).
     * Use this when the status changes without an ownership change
     * (e.g., IN_STOCK after receiving, SOLD after sale).
     */
    function updateBatchStatus(bytes32 batchId, Status newStatus)
        external
        batchExists(batchId)
    {
        Batch storage batch = batches[batchId];
        if (batch.currentOwner != msg.sender) revert NotCurrentOwner(batchId, msg.sender);
        if (batch.recalled && newStatus != Status.RECALLED)
            revert BatchIsRecalled(batchId);

        Status oldStatus = batch.status;
        _validateTransition(oldStatus, newStatus);
        batch.status = newStatus;

        emit StatusUpdated(batchId, true, oldStatus, newStatus, msg.sender, block.timestamp);
    }

    /**
     * @dev Update the status of an individual unit.
     */
    function updateUnitStatus(bytes32 unitId, Status newStatus)
        external
        unitExists(unitId)
    {
        Unit storage unit = units[unitId];
        if (unit.currentOwner != msg.sender) revert NotCurrentOwner(unitId, msg.sender);
        if (batches[unit.batchId].recalled && newStatus != Status.RECALLED)
            revert BatchIsRecalled(unit.batchId);

        Status oldStatus = unit.status;
        _validateTransition(oldStatus, newStatus);
        unit.status = newStatus;

        emit StatusUpdated(unitId, false, oldStatus, newStatus, msg.sender, block.timestamp);
    }

    // =========================================================
    // RECALL MANAGEMENT
    // =========================================================

    /**
     * @dev Recall a batch. Only manufacturer or admin can initiate.
     * After recall:
     * - The batch status becomes RECALLED
     * - All units of this batch will reflect RECALLED when queried
     *   (checked via parent batch's recalled flag)
     * - No transfers are permitted on this batch
     *
     * NOTE: The contract marks the batch as recalled on-chain.
     * Physically retrieving products from stores requires off-chain coordination.
     */
    function recallBatch(bytes32 batchId, string calldata reason)
        external
        batchExists(batchId)
    {
        Batch storage batch = batches[batchId];

        bool isManufacturer = hasRole(MANUFACTURER_ROLE, msg.sender)
                              && batch.manufacturer == msg.sender;
        bool isAdmin = hasRole(DEFAULT_ADMIN_ROLE, msg.sender);

        if (!isManufacturer && !isAdmin)
            revert UnauthorizedRole(msg.sender, MANUFACTURER_ROLE);
        if (bytes(reason).length == 0) revert EmptyString("reason");

        batch.recalled     = true;
        batch.recallReason = reason;
        batch.status       = Status.RECALLED;

        emit BatchRecalled(batchId, reason, msg.sender, block.timestamp);
        emit StatusUpdated(batchId, true, batch.status, Status.RECALLED, msg.sender, block.timestamp);
    }

    // =========================================================
    // VIEW FUNCTIONS
    // =========================================================

    function getProductType(bytes32 productId)
        external view
        returns (ProductType memory)
    {
        if (!productTypes[productId].exists) revert ProductNotFound(productId);
        return productTypes[productId];
    }

    function getBatch(bytes32 batchId)
        external view
        batchExists(batchId)
        returns (Batch memory)
    {
        return batches[batchId];
    }

    function getUnit(bytes32 unitId)
        external view
        unitExists(unitId)
        returns (Unit memory, bool parentRecalled)
    {
        Unit memory u = units[unitId];
        parentRecalled = batches[u.batchId].recalled;
        return (u, parentRecalled);
    }

    function getBatchUnits(bytes32 batchId)
        external view
        batchExists(batchId)
        returns (bytes32[] memory)
    {
        return batchUnits[batchId];
    }

    function getTransferHistory(bytes32 itemId)
        external view
        returns (TransferRecord[] memory)
    {
        return transferHistory[itemId];
    }

    function getAllProductTypeIds() external view returns (bytes32[] memory) {
        return allProductTypeIds;
    }

    function getAllBatchIds() external view returns (bytes32[] memory) {
        return allBatchIds;
    }

    function getAllUnitIds() external view returns (bytes32[] memory) {
        return allUnitIds;
    }

    function getProductTypeCount() external view returns (uint256) {
        return allProductTypeIds.length;
    }

    function getBatchCount() external view returns (uint256) {
        return allBatchIds.length;
    }

    function getUnitCount() external view returns (uint256) {
        return allUnitIds.length;
    }

    /**
     * @dev Check effective status of a unit (inherits RECALLED from parent batch).
     */
    function getEffectiveUnitStatus(bytes32 unitId)
        external view
        unitExists(unitId)
        returns (Status)
    {
        Unit memory u = units[unitId];
        if (batches[u.batchId].recalled) return Status.RECALLED;
        return u.status;
    }

    // =========================================================
    // INTERNAL: STATE MACHINE VALIDATION
    // =========================================================

    /**
     * @dev Validates that a status transition is allowed.
     *
     * Allowed transitions:
     * REGISTERED   → IN_TRANSIT, QUARANTINED, RECALLED, DAMAGED
     * IN_TRANSIT   → RECEIVED, DAMAGED, QUARANTINED, RECALLED
     * RECEIVED     → IN_STOCK, QUARANTINED, RECALLED, DAMAGED
     * IN_STOCK     → IN_TRANSIT, SOLD, DELIVERED, QUARANTINED, RECALLED, EXPIRED, DAMAGED
     * QUARANTINED  → RECALLED, IN_STOCK, DAMAGED
     * SOLD         → DELIVERED (delivery confirmation)
     * DELIVERED    → (terminal)
     * RECALLED     → (terminal)
     * DAMAGED      → (terminal)
     * EXPIRED      → (terminal)
     */
    function _validateTransition(Status current, Status next) internal pure {
        if (current == next) return; // No-op (same status)

        bool valid = false;

        if (current == Status.REGISTERED) {
            valid = (next == Status.IN_TRANSIT || next == Status.QUARANTINED ||
                     next == Status.RECALLED   || next == Status.DAMAGED);
        } else if (current == Status.IN_TRANSIT) {
            valid = (next == Status.RECEIVED   || next == Status.DAMAGED ||
                     next == Status.QUARANTINED || next == Status.RECALLED);
        } else if (current == Status.RECEIVED) {
            valid = (next == Status.IN_STOCK   || next == Status.QUARANTINED ||
                     next == Status.RECALLED   || next == Status.DAMAGED);
        } else if (current == Status.IN_STOCK) {
            valid = (next == Status.IN_TRANSIT || next == Status.SOLD ||
                     next == Status.DELIVERED  || next == Status.QUARANTINED ||
                     next == Status.RECALLED   || next == Status.EXPIRED ||
                     next == Status.DAMAGED);
        } else if (current == Status.QUARANTINED) {
            valid = (next == Status.RECALLED || next == Status.IN_STOCK || next == Status.DAMAGED);
        } else if (current == Status.SOLD) {
            valid = (next == Status.DELIVERED);
        }
        // RECALLED, DAMAGED, EXPIRED, DELIVERED are terminal states

        if (!valid) revert InvalidStatusTransition(current, next);
    }
}
