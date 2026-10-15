# Research, Evidence and Technology Selection

## 1. Scope and Research Standard
The Sports Facilities Management System (SFMS) manages campus sports venues, reservations, equipment inventory, and facility maintenance for a university campus. All academic sources are grounded in recent research (2021–2026). Technical manuals are cited for DBMS-level guarantees (InnoDB row-level locking, foreign key constraints, composite index optimization).

A critical finding in literature screening:
- A 2022 paper on sports equipment management efficiency in *Scientific Programming* was retracted by the publisher; it is documented as excluded and **not** cited as valid evidence.
- A 2025 facility/booking database article by Mahathir et al. is an academic **preprint** on Preprints.org and is properly identified as a preprint rather than peer-reviewed literature.

## 2. Technology Stack & Architectural Rationale

| Layer | Technology | Rationale | Alternatives Not Chosen |
|---|---|---|---|
| **Client Tier** | React 19 + TypeScript + Vite | Type safety prevents mismatched API schema models; Vite ensures fast local compilation; Tailwind CSS provides responsive and accessible UI without bloated runtime styling. | Server-side rendering (Next.js) introduces unnecessary hydration and routing overhead for a local college DBMS demonstration. |
| **Server Tier (API)** | Node.js + Express + TypeScript | Lightweight, explicit REST endpoints; clean middleware chain for auth, input validation, and transaction boundaries. | Spring Boot or ASP.NET Core require heavy JVM/.NET SDK footprints without adding pedagogical value for a DBMS viva. |
| **Server Tier (DBMS)** | MySQL 8.4 LTS / MariaDB with InnoDB Engine | True relational model; supports ACID transactions, row-level locking (`SELECT ... FOR UPDATE`), check constraints, composite B-tree indexes, and views. | MongoDB / NoSQL lack ACID foreign key cascades and relational integrity; SQLite lacks concurrent network locking and robust user privilege controls. |
| **Database Driver** | `mysql2/promise` with Connection Pool | Raw parameterized SQL (`?` placeholders) keeps relational queries transparent and directly assessable in viva examinations. | Heavy ORMs (Prisma, TypeORM, Hibernate) abstract away SQL query plans, joins, and row locking primitives. |

### Architectural Model: Two-Tier Client/Server
The application implements a strict two-tier client/server architecture:
1. **Tier 1 (Client):** Single Page Application running in the user's web browser.
2. **Tier 2 (Server):** Express REST API application server communicating over a dedicated connection pool with the MySQL/MariaDB database server.

The client **never** holds database credentials or executes SQL directly. All requests pass through authentication, role authorization, and input validation layers before executing parameterized SQL statements.

## 3. Academic Literature & Technical Primary References

### A. Academic Literature
1. **Mahathir, A. A. B., Hang, P. L., Hei, C. Z., Hua, L. T., & Amin, N. U. (2025).**  
   *Design and Implementation of a Relational Database System for Efficient Facility and Booking Management.*  
   Preprints.org, posted 3 March 2025. DOI: `10.20944/preprints202503.0070`.  
   *Status:* Academic Preprint (Not peer-reviewed).  
   *Contribution:* Informs relational modeling of facilities, bookings, user memberships, and conflict detection.

2. **Frontiers in Psychology Research Team (2021).**  
   *Design and Implementation of Intelligent Sports Training System for College Students' Mental Health Education.*  
   Frontiers in Psychology, 12:634978. DOI: `10.3389/fpsyg.2021.634978`.  
   *Contribution:* Informs entity separation of campus athletic venues, participants, and staff resources.

### B. Technical Documentation
1. **Oracle Corporation (2024).** *MySQL 8.4 Reference Manual: InnoDB Locking and Transaction Model.*  
   URL: `https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-transaction-model.html`
2. **Oracle Corporation (2024).** *MySQL 8.4 Reference Manual: Foreign Key Constraints.*  
   URL: `https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html`
3. **Oracle Corporation (2024).** *MySQL 8.4 Reference Manual: Optimization and Indexes.*  
   URL: `https://dev.mysql.com/doc/refman/8.4/en/optimization-indexes.html`
