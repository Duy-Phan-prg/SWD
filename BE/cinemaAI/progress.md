# CinemaAI Progress

## Current snapshot

- Updated: 2026-06-25 (Asia/Ho_Chi_Minh).
- Git HEAD at inspection: `477c0ec`.
- Stack: Spring Boot 3.5.13, Java 17 source, Maven Wrapper, PostgreSQL runtime, H2 tests.
- Product code is organized into consolidated `AuthController`, `CustomerPublicController`, `AdminController`, and `StaffController`.

## This session

Created the Harness Engineering baseline:

- `AGENTS.md`
- `architecture.md`
- `api-contract.md`
- `domain-rules.md`
- `init.ps1`
- `progress.md`
- `feature_list.json`

Evidence gathered from controllers, DTOs, services, security config, migrations, tests, Postman docs, SRS and role-based flows.

## Verification

### Passed

```powershell
.\mvnw.cmd -DskipTests package
```

Result: `BUILD SUCCESS` on 2026-06-25.

Several suites pass individually in the full run, including auth integration, booking integration, payment integration, recommendation, foundation, migration inventory, movie/actor, Cloudinary and ticket pricing integration tests.

### Failed baseline

```powershell
.\mvnw.cmd test
```

Observed failures:

1. Endpoint inventory tests still read controller files removed by controller consolidation, including `UserController.java`, `AdminUserController.java` and other old domain controllers.
2. `CinemaShowtimeIntegrationTests` has a functional assertion failure.
3. `TicketPricingSchemaCleanup` dùng `database()` và metadata query theo MySQL nên không tương thích H2; logic này cũng không phù hợp PostgreSQL runtime.
4. Cleanup attempts `ticket_type = 'SENIOR'` while the H2 enum only allows `ADULT`, `CHILD`, `STUDENT`.

Full test is therefore not a clean completion gate yet.

## Architecture and configuration gaps

- Flyway SQL exists (`V1`–`V5`) but `flyway-core` is absent and Flyway is disabled.
- Runtime database được xác định là PostgreSQL với `ddl-auto=update`; tests dùng H2 PostgreSQL mode. H2 mode vẫn không thay thế được integration test trên PostgreSQL thật.
- `.env.example` đã dùng PostgreSQL URL và phù hợp với database mục tiêu.
- `pom.xml` còn chứa cả PostgreSQL và MySQL runtime drivers; MySQL connector là dependency dư cần loại bỏ sau khi rà soát profile triển khai.
- Migration `V1`–`V5` còn dùng SQL Server dialect (`dbo`, `IDENTITY`, `NVARCHAR`, `DATETIME2`) nên chưa chạy được trên PostgreSQL.
- Ticket schema cleanup is a startup migration workaround and should become a proper versioned migration.
- Some docs contain historical statements that no longer match current code (for example hold duration and review/report status).

## Recommended next actions

1. Fix endpoint inventory tests to inspect consolidated controllers.
2. Loại bỏ `TicketPricingSchemaCleanup` mang cú pháp MySQL và thay bằng PostgreSQL Flyway migration.
3. Chuẩn hóa PostgreSQL + Flyway thành schema path duy nhất; chuyển migration sang PostgreSQL dialect, bật Flyway và đặt Hibernate thành `validate`.
4. Re-run full tests and update evidence/status.
5. Add concurrency-safe seat locking test for simultaneous hold requests.
6. Review production protection for mock payment, actuator exposure and default JWT secret.

## Handoff rule

Future sessions must append/update:

- task scope;
- files changed;
- commands actually run;
- pass/fail evidence;
- unresolved blockers;
- next concrete action.

Do not replace a failing baseline with an unverified “done”.
