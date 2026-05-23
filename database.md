## Table `ai_analyses`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `machine_id` | `uuid` |  |
| `risk_level` | `varchar` |  |
| `risk_score` | `int4` |  |
| `health_percentage` | `int4` |  |
| `trend` | `varchar` |  |
| `prediction` | `text` |  |
| `recommendation` | `text` |  |
| `estimated_failure_hours` | `int4` |  Nullable |
| `urgent` | `bool` |  |
| `analyzed_at` | `timestamptz` |  |

## Table `areas`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `varchar` |  |
| `code` | `varchar` |  Unique |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `audit_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `incident_id` | `uuid` |  Nullable |
| `user_id` | `uuid` |  Nullable |
| `action` | `varchar` |  |
| `old_value` | `text` |  Nullable |
| `new_value` | `text` |  Nullable |
| `ip_address` | `varchar` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `incident_replies`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `incident_id` | `uuid` |  |
| `user_id` | `uuid` |  |
| `message` | `text` |  |
| `created_at` | `timestamptz` |  |

## Table `incidents`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `machine_id` | `uuid` |  |
| `reading_id` | `uuid` |  Nullable |
| `title` | `varchar` |  |
| `description` | `text` |  Nullable |
| `severity` | `varchar` |  |
| `status` | `varchar` |  |
| `risk_score` | `int4` |  |
| `acknowledged_by` | `uuid` |  Nullable |
| `acknowledged_at` | `timestamptz` |  Nullable |
| `resolved_by` | `uuid` |  Nullable |
| `resolved_at` | `timestamptz` |  Nullable |
| `deleted_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `image_url` | `text` |  Nullable |

## Table `lines`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `varchar` |  |
| `code` | `varchar` |  Unique |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `machine_types`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `varchar` |  |
| `code` | `varchar` |  Unique |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `machines`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `varchar` |  |
| `code` | `varchar` |  Unique |
| `type` | `varchar` |  |
| `location` | `varchar` |  Nullable |
| `status` | `varchar` |  |
| `created_at` | `timestamptz` |  |

## Table `push_subscriptions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `endpoint` | `text` |  Nullable |
| `p256dh` | `text` |  Nullable |
| `auth_key` | `text` |  Nullable |
| `expo_token` | `text` |  Nullable |
| `device_type` | `varchar` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `sensor_readings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `machine_id` | `uuid` |  |
| `temperature` | `numeric` |  Nullable |
| `vibration` | `numeric` |  Nullable |
| `pressure` | `numeric` |  Nullable |
| `rpm` | `int4` |  Nullable |
| `efficiency` | `numeric` |  Nullable |
| `is_anomaly` | `bool` |  |
| `read_at` | `timestamptz` |  |

## Table `users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `varchar` |  |
| `email` | `varchar` |  Unique |
| `password` | `varchar` |  |
| `role` | `varchar` |  |
| `phone` | `varchar` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

