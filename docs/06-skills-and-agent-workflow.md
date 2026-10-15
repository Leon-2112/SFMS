# Skills and Agent Workflow

This document records the agent development guidelines, skill dependencies, and verification cycles used for the Sports Facilities Management System (SFMS).

## 1. Applied Skill Disciplines
- `ultra-mode`: Enforced verification loop covering unit test execution with `node:test`, real browser validation with `playwright-cli`, and UX critique before completion.
- `frontend-design`: Applied clean domain-specific athletic facilities theme (slate/emerald palette, accessible form controls, status pills, tabular metrics, and visual ERD inspector).

## 2. Verification Protocol
1. Execute unit tests for booking interval algebra and RBAC rules:
   ```bash
   node --test src/utils/rules.test.ts
   ```
2. Start or restart Express and dev server.
3. Use `playwright-cli` to test user journeys across Member, Admin, and Maintenance Staff roles.
4. Verify database state directly via MySQL client.
