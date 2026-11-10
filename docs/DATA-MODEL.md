# Data Model - Skema Database WM-Toolkit

## Konsep
- Approval AFCE dicatat manual berdasarkan SAP.
- Setelah AFCE approved, dua cabang paralel:
  - Barang: PR → vendor_evaluation → PO → goods_handover
  - Jasa: USPK → technical_evaluation → SPK → progress_logs
- Satu proyek bisa punya kedua jalur.

## Entity Relationship
```
users 1---N projects (PIC)
projects 1---N afce
afce 1---N approval_matrix_levels
afce 1---N approval_records
afce 1---N purchase_requisitions (PR)   [jalur barang]
PR 1---N vendor_evaluations
PR 1---N purchase_orders (PO)
PO 1---N po_items
PO 1---1 goods_handovers
afce 1---N uspk                          [jalur jasa]
USPK 1---N technical_evaluations
USPK 1---1 spk
projects 1---N progress_logs
projects 1---N comments
projects 1---N attachments
users 1---N notifications
users 1---N notification_settings
users 1---N audit_logs
```

### users
id UUID PK, name, email unique, password_hash, role Enum(ADMIN,PIC,VIEWER), jabatan String, is_active, created_at, updated_at

### projects
id UUID PK, project_code unique, name, description, pic_id FK, status Enum(PLANNED,IN_PROGRESS,ON_HOLD,COMPLETED,CANCELLED), start_date, target_end_date, actual_start_date, actual_end_date, progress_percent Int, created_by FK, deleted_at nullable

### afce
id UUID PK, project_id FK, afce_number unique, amount Decimal, status Enum(DRAFT,IN_REVIEW,APPROVED,REJECTED), sap_reference nullable, created_by FK, deleted_at nullable

### approval_matrix_levels
id UUID PK, afce_id FK, level Int, jabatan String, is_required Boolean

### approval_records
id UUID PK, afce_id FK, matrix_level_id FK, approver_name, approver_jabatan, action Enum(APPROVED,REJECTED), decided_at, notes nullable, sap_evidence_url nullable, recorded_by FK, created_at

### purchase_requisitions (PR) - jalur barang
id UUID PK, afce_id FK, pr_number, sap_number nullable, status Enum(DRAFT,RELEASED,CLOSED), released_at, created_by FK, deleted_at nullable

### vendor_evaluations
id UUID PK, pr_id FK, evaluator_id FK users, evaluation_date, result Enum(RECOMMENDED,NOT_RECOMMENDED), notes Text, created_at

### purchase_orders (PO)
id UUID PK, pr_id FK, po_number, vendor_name, status Enum(DRAFT,RELEASED,CLOSED), released_at, created_by FK, deleted_at nullable

### po_items
id UUID PK, po_id FK, item_name, quantity Int, unit, price Decimal, total Decimal

### goods_handovers (Serah Terima Barang)
id UUID PK, po_id FK unique, handover_date, receiver_name, giver_name, berita_acara_url nullable, status Enum(PENDING,COMPLETED), created_by FK, created_at

### uspk (Usulan SPK) - jalur jasa
id UUID PK, afce_id FK, work_item_id FK nullable, uspk_number, vendor_name, scope Text, target_volume Decimal, uom String, value Decimal, start_date, end_date, status Enum(DRAFT,SUBMITTED,APPROVED,REJECTED), submitted_at, decided_at, created_by FK, deleted_at nullable

### technical_evaluations
id UUID PK, uspk_id FK, evaluator_id FK users, evaluation_date, result Enum(RECOMMENDED,NOT_RECOMMENDED), notes Text, created_at

### spk
id UUID PK, uspk_id FK unique, work_item_id FK, spk_number, vendor_name, target_volume Decimal, uom String, value Decimal, start_date, end_date, status Enum(DRAFT,ACTIVE,CLOSED), released_at, created_by FK, deleted_at nullable

### progress_logs
id UUID PK, project_id FK, work_item_id FK, spk_id FK nullable, log_date, period_type Enum(DAILY,WEEKLY), description, target_volume Decimal nullable, actual_volume Decimal nullable, remaining_volume Decimal nullable, uom String nullable, percent_complete Int (auto-calculated), photo_url nullable, created_by FK

### comments
id UUID PK, project_id FK, user_id FK, content Text, mentioned_user_ids JSON, created_at

### attachments
id UUID PK, project_id FK, source Enum(GOOGLE_DRIVE_LINK,UPLOAD), file_url, file_name, uploaded_by FK

### notifications
id UUID PK, user_id FK, type Enum(LATE_PROJECT,PENDING_APPROVAL,NEW_TASK,DEADLINE_REMINDER), title, message, is_read, created_at

### notification_settings
id UUID PK, user_id FK, notification_type Enum, is_enabled

### audit_logs
id UUID PK, user_id FK, action, entity_type, entity_id UUID, before_data JSON, after_data JSON, ip_address, created_at
