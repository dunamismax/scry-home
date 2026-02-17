create index if not exists audit_log_action_created_idx
  on "auditLog" (action, "createdAt" desc);
