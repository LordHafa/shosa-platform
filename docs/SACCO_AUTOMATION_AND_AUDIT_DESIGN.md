# SHOSA SACCO Automation and Audit Design

## Purpose
This document records the launch-ready SACCO safety controls added to reduce confusion, incorrect member self-selection, weak payment records, and audit risk.

## Public SACCO registration rules

1. New SACCO applicants are always created as **Regular members**.
2. Founder / Pioneer and Executive / Committee categories are **not self-selected** by alumni.
3. Elevated membership categories must be assigned later by an authorized SACCO/admin role.
4. The public form only asks the member to choose a savings plan:
   - Monthly savings — UGX 50,000
   - Quarterly savings — UGX 200,000
   - Decide after activation
5. The system automatically stores the contribution amount and purpose. Users do not manually type critical SACCO meaning.
6. Notes are optional and may only be used for human context, not payment or membership classification.

## First payment rule

A SACCO applicant is not active until the UGX 50,000 membership registration fee is submitted and confirmed.

The system prevents other SACCO payment types before this first fee.

## Payment automation rules

Fixed SACCO obligations use locked amounts:

| Payment type | Amount |
|---|---:|
| Membership registration | UGX 50,000 |
| Yearly subscription | UGX 100,000 |
| Monthly savings | UGX 50,000 |
| Quarterly savings | UGX 200,000 |

Only voluntary top-ups/donations may use custom amounts.

## Audit controls

Each payment record is expected to keep:

- alumni ID
- payment type
- system-generated label/purpose
- amount
- currency
- phone/network/channel
- transaction reference or hash where applicable
- proof file name where applicable
- status
- raw submitted payload
- created date

## Payment statuses

Launch-ready statuses include:

- pending_gateway_confirmation
- pending_verification
- confirmed
- rejected

## Uganda payment approach

For launch, MTN Mobile Money and Airtel Money are the priority channels. Crypto remains a manual-verification future option unless the SACCO leadership approves wallet custody, exchange-rate policy, compliance, and accounting procedures.

## Recommended next build phase

1. Add admin payment verification screen.
2. Add gateway callback endpoints for MTN/Airtel.
3. Add receipt number generation.
4. Add email/SMS receipt provider integration.
5. Add immutable audit log table.
6. Add SACCO role-based permissions for Treasurer, Auditor, SACCO Staff, and Super Admin.
