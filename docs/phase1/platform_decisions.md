# TravelSphere Platform Decision Record (Phase 1)

## 1. Purpose
This document records final stack decisions so the team does not repeatedly revisit settled choices.

---

## 2. Final Decisions

### Decision 1: Frontend Hosting
- Chosen: Vercel free tier
- Reason: zero server maintenance, fast deployment, easy GitHub integration

### Decision 2: Core Database
- Chosen: PostgreSQL
- Reason: relational booking model and admin analytics require joins and consistency

### Decision 3: MongoDB Usage
- Chosen: not used as primary core database in MVP
- Reason: would increase complexity for booking/transaction reporting
- Note: can be added later for optional flexible modules

### Decision 4: Backend Hosting During Development
- Chosen: local backend by default
- Reason: no always-on cloud cost, easier debugging

### Decision 5: AWS Adoption Timing
- Chosen: later phase (optional deployment variant)
- Reason: keep early phases low-cost and fast; still include AWS learning in final cycle

### Decision 6: Infrastructure Portability
- Chosen: environment-based config + optional Terraform/Ansible in later phase
- Reason: reproducible setup without overcomplicating early delivery

---

## 3. Review Trigger Rules
Revisit these decisions only if one of the following happens:
- Required feature cannot be implemented with current stack
- Free tier limits block project demo use
- Faculty/reviewer explicitly requires AWS-first deployment

---

## 4. Change Control
Any major change must include:
- Problem statement
- Proposed alternative
- Cost and complexity impact
- Migration impact
- Approval before implementation
