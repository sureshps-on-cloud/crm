# Al Bustan Sales Distribution CRM Requirements

## 1. Business Context
Al Bustan is a distributor of dry fruits and complementary products (e.g., honey, dates, coffee, chocolate, sweets, others) in the Gulf region. The CRM system is designed to support field agents who sell and distribute perishable and non-perishable products to a variety of retail outlets, including supermarkets, premium outlets, local vendors, and other retail stores (excluding restaurants). The system must be flexible to accommodate future expansion into new product lines and regions.

## 2. Product Management
- **Primary Products:** Dry fruits (with support for future addition of honey, dates, coffee, chocolate, sweets, etc.)
- **Packaging:**
  - Standard packaging sizes (e.g., 250g, 500g, 1kg, etc.)
  - Support for custom packaging for bulk/wholesale orders
- **Batch / Lot Tracking:** For perishable goods, each stock item must have a batch number with a corresponding manufacturing and expiry date. This enables a **First-Expired, First-Out (FEFO)** stock management strategy.
- **Pricing Engine:** The system must support a robust pricing engine with:
  - Multiple price lists (e.g., wholesale, retail).
  - Contract pricing per outlet.
  - A clear hierarchy for applying discounts (e.g., promotional vs. contract discounts).

## 3. Outlet Management
- **Outlet Types:** Supermarkets, premium outlets, local vendors, and other retail outlets
- **Segmentation & Tiering:**
  - Outlets are segmented by type, size, and sales volume.
  - A formal **Customer Tiering** system (e.g., Platinum, Gold, Silver) will be implemented, automatically assigned based on rules (sales volume, payment history) to unlock specific benefits.
- **New Outlet Onboarding Workflow:** A standardized, checklist-driven process for adding new outlets, including capturing location, photos, contact details, and initial credit terms (subject to supervisor approval).

## 4. Agent Operations & Field Sales
- **Assignment & Planning:**
  - Agents can be assigned any product or outlet dynamically.
  - Supervisors manually assign daily stock via a UI with system recommendations.
  - The system will evolve to use **predictive analytics** (learning from sales history, seasonality, and promotions) to suggest optimized van stock.
  - The system suggests and optimizes routes and tracks visited, missed, and rescheduled outlets.
- **Visit Activities & Data Integrity:**
  - Agents fulfill orders on the spot (van sales) or take pre-orders.
  - **Geofencing:** Delivery and visit confirmations are validated by ensuring the agent's GPS coordinates are within a predefined radius of the outlet.
- **Closed-Loop Feedback System:**
  - Feedback/complaints create a "ticket" assigned to a person or department.
  - The ticket is tracked until resolved, with status visible to the agent and supervisor.

## 5. Stock & Inventory Management
- **Van Stock Reconciliation:** A mandatory daily or end-of-route reconciliation process. The system generates a report comparing starting stock, sales, returns, and actual closing stock to identify any variance.
- **Categorization of Returns:** Returns are categorized for proper processing:
  - **Unsold:** Good condition, return to inventory.
  - **Expired:** Must be written off.
  - **Damaged:** Claimable or written off.
  - **Customer Return/Exchange:** Linked to a specific sales order.
- **Alerts:** The system provides alerts for near-expiry and expired items.

## 6. Order & Delivery Management
- **Order Types:** The system supports two primary order types:
  - **Immediate Fulfillment:** Standard van sales where an order is created and fulfilled on the spot.
  - **Pre-Orders:** Orders placed for future delivery.
- **Order Tracking:** Each order is linked to the outlet, agent, products, quantities, and delivery status, confirmed via geolocation.

### 6.1. Order Entitlements & Recurring Sales
To manage long-term contracts and subscriptions, the system implements an **Order Entitlement** module. This is designed to automate recurring revenue and streamline scheduled deliveries.

- **Concept:** An "entitlement" is a master record of a recurring sale commitment (e.g., a weekly delivery of a specific product to an outlet).
- **Automatic Order Generation:**
  - When an entitlement is active, the system will **automatically generate a new `Order`** based on the defined schedule (`WEEKLY`, `MONTHLY`, etc.).
  - This removes the need for agents to manually create recurring orders and reduces the risk of missed deliveries.
- **Fulfillment Tracking:** The entitlement tracks the total quantity promised versus the quantity already delivered over its lifetime, providing a clear view of contract fulfillment.
- **Triggering Event:** Entitlements are typically created automatically when an opportunity with a "Recurring" product is marked as "Won," or they can be created manually for special contracts.

## 7. Payment Handling
- **Payment Methods:** Cash, card (POS), and digital wallets (e.g., STC Pay, Apple Pay).
- **Credit System & Workflow:**
  - Support for credit sales with configurable limits and terms.
  - A formal **Credit Approval Workflow** for requesting and approving credit for outlets.
  - Track outstanding payments, due dates, and overdue alerts.
- **Payment Reconciliation:** The system must have a module to reconcile collected payments against settlement reports from payment gateways and manage disputes.

## 8. Reporting & Analytics
- **Standard Reports:** Daily sales, outlet coverage, stock wastage, payment collections, and agent performance.
- **Profitability Analysis:** Reports by agent, product/category, and outlet/segment.
- **Agent Leaderboards:** Gamified, real-time rankings of agents on key metrics.
- **Heat Maps:** A visual map for supervisors showing outlets color-coded by sales volume, pending visits, or overdue payments.
- **Dashboards:** Real-time dashboards for supervisors and management, with exportable reports.

## 9. Scalability & Integration
- **Scalability:** System designed for expansion (regions, products, channels).
- **Integration:** Secure, well-documented RESTful APIs for integration with ERP, accounting, etc. A **GraphQL** endpoint will be considered for frontend/mobile apps to optimize data fetching.

## 10. Technical & Non-Functional Requirements
- **Core Tech Stack:** Fastify, MongoDB, TypeScript (ES6).
- **Offline-First Mobile Application:** The agent's mobile interface must be fully functional without an active internet connection, with automatic data sync once connectivity is restored. This is a critical requirement.
- **Real-time Communication:** Use **WebSockets** for instant updates on supervisor dashboards and agent notifications.
- **Caching:** A caching layer (e.g., Redis) will be implemented to improve performance for frequently accessed data.
- **Security:** Role-based access control, data encryption, and audit trails for all critical actions.

## 11. Security & Compliance
- **Data Security:**
  - Role-based access control (admin, supervisor, agent, etc.)
  - Data encryption in transit and at rest
- **Audit Trails:**
  - Track all critical actions (stock assignment, order fulfillment, payment collection, etc.)
- **Compliance:**
  - Adherence to local data protection and privacy regulations

---

This requirements document is designed to be comprehensive and flexible, supporting Al Bustan's current sales distribution operations and future growth. Please review and suggest any additions or changes as needed.