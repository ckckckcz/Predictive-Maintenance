-- Initial Supervisor Account
INSERT INTO users (name, email, password, role, phone, is_active)
VALUES (
    'John Doe',
    'admin@greenfields.com',
    '$2a$12$ihi1DdKsqhSypALHfa9f.ecdYz3NPYHBLpT2ogc7we58ystT/yxm2',
    'SUPERVISOR',
    '+6281234567890',
    true
) ON CONFLICT (email) DO NOTHING;

-- Initial Operator Account
INSERT INTO users (name, email, password, role, phone, is_active)
VALUES (
    'Bob Smith',
    'operator@greenfields.com',
    '$2a$12$ihi1DdKsqhSypALHfa9f.ecdYz3NPYHBLpT2ogc7we58ystT/yxm2',
    'OPERATOR',
    '+6289876543210',
    true
) ON CONFLICT (email) DO NOTHING;

-- 5 Virtual Machines
INSERT INTO machines (name, code, type, location, status) VALUES
    ('Mesin Pasteurisasi #1',  'PST-001', 'PASTEURISASI', 'Lantai 1 - Area A', 'ACTIVE'),
    ('Mesin Filling #2',       'FLL-002', 'FILLING',       'Lantai 1 - Area B', 'ACTIVE'),
    ('Conveyor Belt A',        'CNV-001', 'CONVEYOR',      'Lantai 2 - Area A', 'ACTIVE'),
    ('Cold Storage #3',        'CLD-003', 'COLD_STORAGE',  'Lantai 2 - Area B', 'ACTIVE'),
    ('Boiler Unit',            'BLR-001', 'BOILER',        'Lantai 3 - Area A', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;
