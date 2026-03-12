-- ============================================
-- KI-Flow Salon Stack — Initiales DB-Schema
-- Migration 001
-- Ziel-DB: salon_db (separate von n8n DB)
-- ============================================

BEGIN;

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- SALONS (Tenant-Tabelle)
-- ============================================
CREATE TABLE salons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    owner_name      TEXT NOT NULL,
    email           TEXT NOT NULL,
    phone           TEXT,
    address_street  TEXT,
    address_city    TEXT,
    address_zip     TEXT,
    address_country TEXT DEFAULT 'DE',
    opening_hours   JSONB DEFAULT '{
        "mon": {"open": "09:00", "close": "18:00"},
        "tue": {"open": "09:00", "close": "18:00"},
        "wed": {"open": "09:00", "close": "18:00"},
        "thu": {"open": "09:00", "close": "20:00"},
        "fri": {"open": "09:00", "close": "18:00"},
        "sat": {"open": "09:00", "close": "14:00"},
        "sun": null
    }',
    timezone        TEXT DEFAULT 'Europe/Berlin',
    settings        JSONB DEFAULT '{}',
    subscription    TEXT DEFAULT 'trial' CHECK (subscription IN ('trial','basic','pro','enterprise')),
    trial_ends_at   TIMESTAMPTZ,
    stripe_customer_id  TEXT,
    vapi_assistant_id   TEXT,
    waba_phone_id       TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAFF / MITARBEITER
-- ============================================
CREATE TABLE staff (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    role            TEXT DEFAULT 'stylist' CHECK (role IN ('owner','stylist','assistant','receptionist')),
    color           TEXT DEFAULT '#3B82F6',
    working_hours   JSONB DEFAULT '{
        "mon": [{"start": "09:00", "end": "18:00"}],
        "tue": [{"start": "09:00", "end": "18:00"}],
        "wed": [{"start": "09:00", "end": "18:00"}],
        "thu": [{"start": "09:00", "end": "20:00"}],
        "fri": [{"start": "09:00", "end": "18:00"}],
        "sat": [{"start": "09:00", "end": "14:00"}],
        "sun": null
    }',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SERVICES / DIENSTLEISTUNGEN
-- ============================================
CREATE TABLE services (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    category        TEXT DEFAULT 'Schnitt' CHECK (category IN ('Schnitt','Farbe','Pflege','Styling','Sonstiges')),
    duration_min    INT NOT NULL CHECK (duration_min > 0),
    buffer_min      INT DEFAULT 0,
    price_cents     INT NOT NULL CHECK (price_cents >= 0),
    description     TEXT,
    is_active       BOOLEAN DEFAULT true,
    sort_order      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Welcher Mitarbeiter kann welchen Service
CREATE TABLE staff_services (
    staff_id        UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (staff_id, service_id)
);

-- ============================================
-- CLIENTS / KUNDEN (CRM)
-- ============================================
CREATE TABLE clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    first_name      TEXT NOT NULL,
    last_name       TEXT,
    phone           TEXT NOT NULL,
    email           TEXT,
    gender          TEXT CHECK (gender IN ('m','f','d')),
    birthday        DATE,
    notes           TEXT,
    hair_type       TEXT,
    hair_color_natural  TEXT,
    hair_color_current  TEXT,
    hair_condition  TEXT,
    allergies       TEXT,
    color_formulas  JSONB DEFAULT '[]',
    preferred_staff_id  UUID REFERENCES staff(id) ON DELETE SET NULL,
    preferred_day   TEXT,
    drink_preference TEXT,
    source          TEXT DEFAULT 'manual' CHECK (source IN ('manual','web','whatsapp','voicebot','instagram','google','walk_in')),
    tags            TEXT[] DEFAULT '{}',
    no_show_count   INT DEFAULT 0,
    requires_prepayment BOOLEAN DEFAULT false,
    total_spent_cents   INT DEFAULT 0,
    visit_count     INT DEFAULT 0,
    last_visit      TIMESTAMPTZ,
    gdpr_consent        BOOLEAN DEFAULT false,
    gdpr_consent_date   TIMESTAMPTZ,
    marketing_consent   BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(salon_id, phone)
);

-- ============================================
-- BOOKINGS / TERMINE
-- ============================================
CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
    staff_id        UUID NOT NULL REFERENCES staff(id),
    service_id      UUID NOT NULL REFERENCES services(id),
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,
    status          TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','completed','no_show','cancelled')),
    source          TEXT DEFAULT 'manual' CHECK (source IN ('manual','web','whatsapp','voicebot','instagram','phone')),
    reminder_24h_sent   BOOLEAN DEFAULT false,
    reminder_1h_sent    BOOLEAN DEFAULT false,
    confirmed_by_client BOOLEAN DEFAULT false,
    price_cents     INT,
    payment_status  TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded')),
    payment_method  TEXT CHECK (payment_method IN ('cash','card','online','prepaid')),
    notes           TEXT,
    rating          INT CHECK (rating BETWEEN 1 AND 5),
    feedback_text   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_timerange CHECK (end_time > start_time)
);

-- ============================================
-- CAMPAIGNS / MARKETING
-- ============================================
CREATE TABLE campaigns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL CHECK (type IN ('reactivation','birthday','upsell','seasonal','custom')),
    template_text   TEXT NOT NULL,
    target_filter   JSONB DEFAULT '{}',
    status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed')),
    sent_count      INT DEFAULT 0,
    booking_count   INT DEFAULT 0,
    scheduled_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- KPI SNAPSHOTS
-- ============================================
CREATE TABLE kpi_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    revenue_cents   INT DEFAULT 0,
    booking_count   INT DEFAULT 0,
    completed_count INT DEFAULT 0,
    new_clients     INT DEFAULT 0,
    no_show_count   INT DEFAULT 0,
    cancellation_count INT DEFAULT 0,
    avg_rating      DECIMAL(3,2),
    occupancy_pct   DECIMAL(5,2),
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(salon_id, date)
);

-- ============================================
-- VOICE CALLS LOG
-- ============================================
CREATE TABLE voice_calls (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    vapi_call_id    TEXT UNIQUE,
    caller_phone    TEXT,
    client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
    duration_sec    INT,
    transcript      TEXT,
    summary         TEXT,
    intent          TEXT CHECK (intent IN ('book','cancel','reschedule','inquiry','other')),
    outcome         TEXT CHECK (outcome IN ('booked','cancelled','rescheduled','transferred','voicemail','dropped')),
    booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGE LOG (WhatsApp, SMS, Email tracking)
-- ============================================
CREATE TABLE message_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
    channel         TEXT NOT NULL CHECK (channel IN ('whatsapp','sms','email')),
    direction       TEXT NOT NULL CHECK (direction IN ('outbound','inbound')),
    template_name   TEXT,
    message_text    TEXT,
    status          TEXT DEFAULT 'sent' CHECK (status IN ('sent','delivered','read','failed')),
    related_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    external_id     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_staff_salon ON staff(salon_id) WHERE is_active = true;
CREATE INDEX idx_services_salon ON services(salon_id) WHERE is_active = true;
CREATE INDEX idx_clients_salon_phone ON clients(salon_id, phone);
CREATE INDEX idx_clients_last_visit ON clients(salon_id, last_visit);
CREATE INDEX idx_clients_tags ON clients USING GIN(tags);
CREATE INDEX idx_bookings_salon_time ON bookings(salon_id, start_time);
CREATE INDEX idx_bookings_staff_time ON bookings(staff_id, start_time);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_status ON bookings(salon_id, status) WHERE status = 'confirmed';
CREATE INDEX idx_bookings_reminder ON bookings(start_time) WHERE status = 'confirmed' AND reminder_24h_sent = false;
CREATE INDEX idx_kpi_salon_date ON kpi_snapshots(salon_id, date);
CREATE INDEX idx_voice_calls_salon ON voice_calls(salon_id, created_at);
CREATE INDEX idx_message_log_client ON message_log(client_id, created_at);

-- ============================================
-- HILFSFUNKTION: updated_at Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_salons_updated_at BEFORE UPDATE ON salons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- HILFSFUNKTION: Verfügbarkeit prüfen
-- ============================================
CREATE OR REPLACE FUNCTION check_slot_available(
    p_salon_id UUID,
    p_staff_id UUID,
    p_start TIMESTAMPTZ,
    p_end TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM bookings
        WHERE salon_id = p_salon_id
          AND staff_id = p_staff_id
          AND status IN ('confirmed')
          AND start_time < p_end
          AND end_time > p_start
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HILFSFUNKTION: Freie Slots finden
-- ============================================
CREATE OR REPLACE FUNCTION find_available_slots(
    p_salon_id UUID,
    p_staff_id UUID,
    p_date DATE,
    p_duration_min INT,
    p_slot_interval_min INT DEFAULT 30
) RETURNS TABLE (slot_start TIMESTAMPTZ, slot_end TIMESTAMPTZ) AS $$
DECLARE
    v_day_start TIME;
    v_day_end TIME;
    v_current TIMESTAMPTZ;
    v_slot_end TIMESTAMPTZ;
    v_day_name TEXT;
    v_hours JSONB;
BEGIN
    v_day_name := LOWER(TO_CHAR(p_date, 'Dy'));

    SELECT working_hours -> v_day_name -> 0 ->> 'start',
           working_hours -> v_day_name -> 0 ->> 'end'
    INTO v_day_start, v_day_end
    FROM staff
    WHERE id = p_staff_id AND salon_id = p_salon_id;

    IF v_day_start IS NULL THEN
        RETURN;
    END IF;

    v_current := p_date + v_day_start;
    WHILE v_current + (p_duration_min || ' minutes')::INTERVAL <= p_date + v_day_end LOOP
        v_slot_end := v_current + (p_duration_min || ' minutes')::INTERVAL;
        IF check_slot_available(p_salon_id, p_staff_id, v_current, v_slot_end) THEN
            slot_start := v_current;
            slot_end := v_slot_end;
            RETURN NEXT;
        END IF;
        v_current := v_current + (p_slot_interval_min || ' minutes')::INTERVAL;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMIT;
