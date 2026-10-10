<?php
// Kumeti API router. Every call: api/index.php?r=<route>
declare(strict_types=1);
require __DIR__ . '/lib.php';

header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

set_exception_handler(function (Throwable $e) {
    error_log('Kumeti: ' . $e->getMessage());
    json_out(['error' => 'SERVER_ERROR', 'detail' => $e->getMessage()], 500);
});

$r = trim((string)($_GET['r'] ?? ''), '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

switch ($r) {

// ================= PUBLIC =================
case 'ping':
    json_out(['ok' => true, 'version' => KUMETI_VERSION, 'installed' => load_config() !== null]);

case 'public/landing':
    json_out([
        'landing' => setting('landing', null),
        'site' => setting('site', ['name' => 'Kumeti', 'allow_signup' => true, 'whatsapp' => '', 'show_demo' => true]),
    ]);

// ================= AUTH =================
case 'auth/login':
    $id = trim((string)in('email', ''));
    $pw = (string)in('password', '');
    if ($id === '' || $pw === '') fail('MISSING_FIELDS');
    $u = one('SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR phone = ?', [$id, $id]);
    if (!$u || !password_verify($pw, $u['password_hash'])) fail('INVALID_LOGIN', 401);
    if ($u['status'] !== 'active') fail('ACCOUNT_DISABLED', 403);
    json_out(['token' => make_session((int)$u['id']), 'user' => public_user($u)]);

case 'auth/register':
    $site = setting('site', ['allow_signup' => true]);
    if (empty($site['allow_signup'])) fail('SIGNUP_DISABLED', 403);
    $name = clean_str(in('name'), 120);
    $email = clean_str(in('email'), 160);
    $phone = clean_str(in('phone'), 40);
    $pw = (string)in('password', '');
    if (!$name || (!$email && !$phone) || strlen($pw) < 6) fail('MISSING_FIELDS');
    if ($email && one('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [$email])) fail('EMAIL_TAKEN');
    if ($phone && one('SELECT id FROM users WHERE phone = ?', [$phone])) fail('PHONE_TAKEN');
    q('INSERT INTO users (name,email,phone,password_hash,role,status,lang,created_at) VALUES (?,?,?,?,?,?,?,?)',
        [$name, $email, $phone, password_hash($pw, PASSWORD_DEFAULT), 'organizer', 'active', normalize_language(in('lang')), now()]);
    $uid = (int)db()->lastInsertId();
    json_out(['token' => make_session($uid), 'user' => public_user(one('SELECT * FROM users WHERE id = ?', [$uid]))]);

case 'auth/me':
    json_out(['user' => public_user(require_user())]);

case 'auth/logout':
    $t = token_header();
    if ($t) q('DELETE FROM sessions WHERE token = ?', [$t]);
    json_out(['ok' => true]);

case 'auth/language':
    $u = require_user();
    if ($method !== 'POST') fail('METHOD_NOT_ALLOWED', 405);
    $lang = normalize_language(in('lang'));
    q('UPDATE users SET lang = ? WHERE id = ?', [$lang, $u['id']]);
    json_out(['lang' => $lang]);

case 'auth/profile':
    $u = require_user();
    $name = clean_str(in('name'), 120) ?? $u['name'];
    $phone = clean_str(in('phone'), 40);
    $email = clean_str(in('email'), 160);
    $lang = normalize_language(in('lang', $u['lang']));
    if ($email && one('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id <> ?', [$email, $u['id']])) fail('EMAIL_TAKEN');
    q('UPDATE users SET name = ?, phone = ?, email = ?, lang = ? WHERE id = ?', [$name, $phone, $email, $lang, $u['id']]);
    $newPw = (string)in('new_password', '');
    if ($newPw !== '') {
        if (strlen($newPw) < 6) fail('PASSWORD_SHORT');
        if (!password_verify((string)in('current_password', ''), $u['password_hash'])) fail('WRONG_PASSWORD');
        q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($newPw, PASSWORD_DEFAULT), $u['id']]);
    }
    json_out(['user' => public_user(one('SELECT * FROM users WHERE id = ?', [$u['id']]))]);

// ================= SUPER ADMIN =================
case 'admin/stats':
    require_user(['superadmin']);
    $roles = [];
    foreach (all('SELECT role, COUNT(*) c FROM users GROUP BY role') as $row) $roles[$row['role']] = (int)$row['c'];
    $k = one('SELECT COUNT(*) c, COALESCE(SUM(amount * slots), 0) pot FROM kametis');
    $active = (int)one("SELECT COUNT(*) c FROM kametis WHERE status = 'active'")['c'];
    $collected = (float)one('SELECT COALESCE(SUM(amount), 0) s FROM payments')['s'];
    $types = [];
    foreach (all('SELECT type, COUNT(*) c FROM kametis GROUP BY type') as $row) $types[$row['type']] = (int)$row['c'];
    $recent = all('SELECT id, name, email, role, created_at FROM users ORDER BY id DESC LIMIT 6');
    json_out(['roles' => $roles, 'kametis' => (int)$k['c'], 'active' => $active, 'volume' => (float)$k['pot'],
        'collected' => $collected, 'types' => $types, 'recent_users' => $recent]);

case 'admin/users':
    $me = require_user(['superadmin']);
    if ($method === 'GET') {
        json_out(['users' => array_map('public_user', all('SELECT * FROM users ORDER BY id DESC'))]);
    }
    $id = (int)in('id', 0);
    $name = clean_str(in('name'), 120);
    $email = clean_str(in('email'), 160);
    $phone = clean_str(in('phone'), 40);
    $role = in('role', 'member');
    $status = in('status', 'active') === 'disabled' ? 'disabled' : 'active';
    if (!in_array($role, ['superadmin', 'organizer', 'member'], true)) fail('BAD_ROLE');
    if (!$name || (!$email && !$phone)) fail('MISSING_FIELDS');
    if ($email && one('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id <> ?', [$email, $id])) fail('EMAIL_TAKEN');
    if ($phone && one('SELECT id FROM users WHERE phone = ? AND id <> ?', [$phone, $id])) fail('PHONE_TAKEN');
    $pw = (string)in('password', '');
    if ($id) {
        if ($id === (int)$me['id'] && ($role !== 'superadmin' || $status !== 'active')) fail('CANNOT_DEMOTE_SELF');
        q('UPDATE users SET name=?, email=?, phone=?, role=?, status=? WHERE id=?', [$name, $email, $phone, $role, $status, $id]);
        if ($pw !== '') q('UPDATE users SET password_hash=? WHERE id=?', [password_hash($pw, PASSWORD_DEFAULT), $id]);
        if ($status === 'disabled') q('DELETE FROM sessions WHERE user_id = ?', [$id]);
    } else {
        if (strlen($pw) < 6) fail('PASSWORD_SHORT');
        q('INSERT INTO users (name,email,phone,password_hash,role,status,lang,created_at) VALUES (?,?,?,?,?,?,?,?)',
            [$name, $email, $phone, password_hash($pw, PASSWORD_DEFAULT), $role, $status, 'en', now()]);
        $id = (int)db()->lastInsertId();
    }
    json_out(['user' => public_user(one('SELECT * FROM users WHERE id=?', [$id]))]);

case 'admin/users/delete':
    $me = require_user(['superadmin']);
    $id = (int)in('id');
    if ($id === (int)$me['id']) fail('CANNOT_DELETE_SELF');
    if (one('SELECT id FROM kametis WHERE organizer_id = ?', [$id])) fail('USER_HAS_KAMETIS');
    q('UPDATE kameti_members SET user_id = NULL WHERE user_id = ?', [$id]);
    q('DELETE FROM sessions WHERE user_id = ?', [$id]);
    q('DELETE FROM users WHERE id = ?', [$id]);
    json_out(['ok' => true]);

case 'admin/landing':
    require_user(['superadmin']);
    $landing = in('landing');
    if (!is_array($landing)) fail('MISSING_FIELDS');
    set_setting('landing', $landing);
    json_out(['ok' => true]);

case 'admin/settings':
    require_user(['superadmin']);
    if ($method === 'GET') json_out(['site' => setting('site', ['name' => 'Kumeti', 'allow_signup' => true, 'whatsapp' => '', 'show_demo' => true])]);
    $site = in('site');
    if (!is_array($site)) fail('MISSING_FIELDS');
    set_setting('site', [
        'name' => clean_str($site['name'] ?? 'Kumeti', 60) ?? 'Kumeti',
        'allow_signup' => !empty($site['allow_signup']),
        'show_demo' => !empty($site['show_demo']),
        'whatsapp' => clean_str($site['whatsapp'] ?? '', 30) ?? '',
        'currency' => clean_str($site['currency'] ?? 'Rs', 8) ?? 'Rs',
    ]);
    json_out(['ok' => true]);

// ================= KAMETIS =================
case 'kametis':
    $u = require_user();
    $sql = 'SELECT k.*, u.name AS organizer_name,
            (SELECT COUNT(*) FROM kameti_members m WHERE m.kameti_id = k.id) AS member_count,
            (SELECT COALESCE(SUM(p.amount),0) FROM payments p WHERE p.kameti_id = k.id) AS collected,
            (SELECT COUNT(*) FROM payouts po WHERE po.kameti_id = k.id AND po.given = 1) AS payouts_done
            FROM kametis k LEFT JOIN users u ON u.id = k.organizer_id';
    $mine = "SELECT kameti_id FROM kameti_members WHERE user_id = ? OR (email IS NOT NULL AND email <> '' AND LOWER(email) = LOWER(?))";
    if ($u['role'] === 'superadmin') $rows = all("$sql ORDER BY k.id DESC");
    elseif ($u['role'] === 'organizer') $rows = all("$sql WHERE k.organizer_id = ? ORDER BY k.id DESC", [$u['id']]);
    else $rows = all("$sql WHERE k.id IN ($mine) ORDER BY k.id DESC", [$u['id'], (string)$u['email']]);
    foreach ($rows as &$row) {
        $row['config'] = json_decode((string)$row['config'], true) ?: [];
        if ($u['role'] === 'member') {
            $me = one("SELECT * FROM kameti_members WHERE kameti_id = ? AND (user_id = ? OR (email IS NOT NULL AND email <> '' AND LOWER(email) = LOWER(?)))", [$row['id'], $u['id'], (string)$u['email']]);
            $row['me'] = $me;
            if ($me) {
                $row['my_slots'] = all('SELECT slot_no, `portion` FROM kameti_slots WHERE kameti_id = ? AND member_id = ? ORDER BY slot_no', [$row['id'], $me['id']]);
                $row['my_paid_rounds'] = array_map('intval', array_column(all('SELECT round_no FROM payments WHERE kameti_id = ? AND member_id = ?', [$row['id'], $me['id']]), 'round_no'));
            }
        }
    }
    json_out(['kametis' => $rows]);

case 'kametis/get':
    $u = require_user();
    $k = kameti_for((int)in('id'), $u);
    $k['config'] = json_decode((string)$k['config'], true) ?: [];
    $k['organizer'] = one('SELECT id, name, phone, email FROM users WHERE id = ?', [$k['organizer_id']]);
    json_out([
        'kameti' => $k,
        'members' => all('SELECT * FROM kameti_members WHERE kameti_id = ? ORDER BY position, id', [$k['id']]),
        'slots' => all('SELECT slot_no, member_id, `portion` FROM kameti_slots WHERE kameti_id = ? ORDER BY slot_no, id', [$k['id']]),
        'payments' => all('SELECT * FROM payments WHERE kameti_id = ?', [$k['id']]),
        'payouts' => all('SELECT * FROM payouts WHERE kameti_id = ? ORDER BY round_no', [$k['id']]),
        'can_edit' => $u['role'] === 'superadmin' || (int)$k['organizer_id'] === (int)$u['id'],
    ]);

case 'kametis/save':
    $u = require_user(['organizer', 'superadmin']);
    $id = (int)in('id', 0);
    $title = clean_str(in('title'), 160);
    $type = in('type');
    $freq = in('frequency', 'monthly');
    $amount = (float)in('amount', 0);
    $slots = (int)in('slots', 0);
    $start = (string)in('start_date', date('Y-m-d'));
    $config = in('config', []);
    $notes = clean_str(in('notes'), 2000);
    if (!$title || $amount <= 0 || $slots < 2 || $slots > 120) fail('MISSING_FIELDS');
    if (!in_array($type, ['fixed', 'qurandazi', 'boli', 'zaroorat'], true)) fail('BAD_TYPE');
    if (!in_array($freq, ['daily', 'weekly', 'monthly'], true)) fail('BAD_FREQUENCY');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start)) fail('BAD_DATE');
    $cfgJson = json_encode(is_array($config) ? $config : [], JSON_UNESCAPED_UNICODE);
    if ($id) {
        $k = kameti_for($id, $u, true);
        if ((int)one('SELECT COUNT(*) c FROM kameti_members WHERE kameti_id = ?', [$id])['c'] > $slots) fail('KAMETI_CAPACITY');
        $status = in('status', $k['status']);
        if (!in_array($status, ['active', 'completed', 'paused'], true)) $status = 'active';
        q('UPDATE kametis SET title=?, type=?, frequency=?, amount=?, slots=?, start_date=?, config=?, notes=?, status=? WHERE id=?',
            [$title, $type, $freq, $amount, $slots, $start, $cfgJson, $notes, $status, $id]);
    } else {
        // Validate capacity before creating any records, including direct API submissions.
        $members = array_values((array)in('members', []));
        if (count($members) > $slots) fail('KAMETI_CAPACITY');
        foreach ($members as $m) if (!is_array($m) || !clean_str($m['name'] ?? null, 120)) fail('MISSING_FIELDS');
        $totals = array_fill(1, $slots, 0.0);
        foreach ((array)in('numbers', []) as $sl) {
            $slot = (int)($sl['slot_no'] ?? 0);
            if ($slot < 1 || $slot > $slots) fail('KAMETI_CAPACITY');
            foreach ((array)($sl['holders'] ?? []) as $h) {
                $portion = (float)($h['portion'] ?? 0);
                if (!isset($members[$h['m'] ?? -1]) || !is_finite($portion) || $portion <= 0 || $portion > 1) fail('KAMETI_CAPACITY');
                $totals[$slot] += $portion;
            }
        }
        foreach ($totals as $total) if (abs($total - 1) > 0.001) fail('KAMETI_CAPACITY');
        q('INSERT INTO kametis (organizer_id,title,type,frequency,amount,slots,start_date,status,config,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [$u['id'], $title, $type, $freq, $amount, $slots, $start, 'active', $cfgJson, $notes, now()]);
        $id = (int)db()->lastInsertId();
        // members: [{name, phone, email}], numbers: [{slot_no, holders: [{m: memberIndex, portion}]}]
        $map = [];
        foreach ($members as $i => $m) {
            $mn = clean_str($m['name'] ?? null, 120);
            if (!$mn) continue;
            $map[$i] = add_member($id, $mn, clean_str($m['phone'] ?? null, 40), clean_str($m['email'] ?? null, 160), $i);
        }
        $ins = [];
        foreach ((array)in('numbers', []) as $sl) {
            foreach ((array)($sl['holders'] ?? []) as $h) {
                if (isset($map[$h['m'] ?? -1])) $ins[] = ['slot_no' => (int)$sl['slot_no'], 'member_id' => $map[$h['m']], 'portion' => (float)$h['portion']];
            }
        }
        write_slots($id, $slots, $ins);
    }
    json_out(['id' => $id]);

case 'kametis/delete':
    $u = require_user(['organizer', 'superadmin']);
    $k = kameti_for((int)in('id'), $u, true);
    foreach (['payments', 'payouts', 'kameti_slots', 'kameti_members'] as $t) q("DELETE FROM $t WHERE kameti_id = ?", [$k['id']]);
    q('DELETE FROM kametis WHERE id = ?', [$k['id']]);
    json_out(['ok' => true]);

// ================= MEMBERS =================
case 'members/save':
    $u = require_user(['organizer', 'superadmin']);
    $k = kameti_for((int)in('kameti_id'), $u, true);
    $id = (int)in('id', 0);
    $name = clean_str(in('name'), 120);
    if (!$name) fail('MISSING_FIELDS');
    $phone = clean_str(in('phone'), 40);
    $email = clean_str(in('email'), 160);
    if ($id) {
        $linked = $email ? one('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [$email]) : null;
        q('UPDATE kameti_members SET name=?, phone=?, email=?, user_id = COALESCE(?, user_id) WHERE id=? AND kameti_id=?',
            [$name, $phone, $email, $linked['id'] ?? null, $id, $k['id']]);
    } else {
        if ((int)one('SELECT COUNT(*) c FROM kameti_members WHERE kameti_id = ?', [$k['id']])['c'] >= (int)$k['slots']) fail('KAMETI_CAPACITY');
        $pos = (int)one('SELECT COALESCE(MAX(position), -1) + 1 p FROM kameti_members WHERE kameti_id = ?', [$k['id']])['p'];
        $id = add_member((int)$k['id'], $name, $phone, $email, $pos);
    }
    json_out(['member' => one('SELECT * FROM kameti_members WHERE id = ?', [$id])]);

case 'members/delete':
    $u = require_user(['organizer', 'superadmin']);
    $k = kameti_for((int)in('kameti_id'), $u, true);
    $mid = (int)in('id');
    q('DELETE FROM payments WHERE kameti_id = ? AND member_id = ?', [$k['id'], $mid]);
    q('DELETE FROM kameti_slots WHERE kameti_id = ? AND member_id = ?', [$k['id'], $mid]);
    q('DELETE FROM kameti_members WHERE id = ? AND kameti_id = ?', [$mid, $k['id']]);
    json_out(['ok' => true]);

case 'members/login':
    $u = require_user(['organizer', 'superadmin']);
    $k = kameti_for((int)in('kameti_id'), $u, true);
    $m = one('SELECT * FROM kameti_members WHERE id = ? AND kameti_id = ?', [(int)in('id'), $k['id']]);
    if (!$m) fail('NOT_FOUND', 404);
    if (!$m['email'] && !$m['phone']) fail('NEED_EMAIL_OR_PHONE');
    $existing = null;
    if ($m['email']) $existing = one('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [$m['email']]);
    if (!$existing && $m['phone']) $existing = one('SELECT * FROM users WHERE phone = ?', [$m['phone']]);
    if ($existing) {
        q('UPDATE kameti_members SET user_id = ? WHERE id = ?', [$existing['id'], $m['id']]);
        json_out(['linked' => true, 'login' => $existing['email'] ?: $existing['phone']]);
    }
    $pw = (string)random_int(100000, 999999);
    q('INSERT INTO users (name,email,phone,password_hash,role,status,lang,created_at) VALUES (?,?,?,?,?,?,?,?)',
        [$m['name'], $m['email'], $m['phone'], password_hash($pw, PASSWORD_DEFAULT), 'member', 'active', 'ur', now()]);
    $uid = (int)db()->lastInsertId();
    q('UPDATE kameti_members SET user_id = ? WHERE id = ?', [$uid, $m['id']]);
    json_out(['linked' => false, 'login' => $m['email'] ?: $m['phone'], 'password' => $pw]);

// ================= SLOTS (numbers) =================
case 'slots/save':
    // Replace the whole arrangement: numbers = [{slot_no, holders: [{member_id, portion}]}]
    $u = require_user(['organizer', 'superadmin']);
    $k = kameti_for((int)in('kameti_id'), $u, true);
    $rows = [];
    foreach ((array)in('numbers', []) as $sl) {
        foreach ((array)($sl['holders'] ?? []) as $h) $rows[] = ['slot_no' => (int)$sl['slot_no'], 'member_id' => (int)$h['member_id'], 'portion' => (float)$h['portion']];
    }
    $valid = array_map('intval', array_column(all('SELECT id FROM kameti_members WHERE kameti_id = ?', [$k['id']]), 'id'));
    $rows = array_values(array_filter($rows, fn($r) => in_array($r['member_id'], $valid, true)));
    // Numbers already paid out must stay exactly as they are.
    foreach (locked_rounds((int)$k['id']) as $r) {
        $rows = array_values(array_filter($rows, fn($x) => $x['slot_no'] !== $r));
        foreach (all('SELECT slot_no, member_id, `portion` FROM kameti_slots WHERE kameti_id = ? AND slot_no = ?', [$k['id'], $r]) as $old) $rows[] = $old;
    }
    write_slots((int)$k['id'], (int)$k['slots'], $rows);
    json_out(['ok' => true]);

case 'slots/shuffle':
    // Qurandazi: shuffle every number that has not been paid out yet.
    $u = require_user(['organizer', 'superadmin']);
    $k = kameti_for((int)in('kameti_id'), $u, true);
    $locked = locked_rounds((int)$k['id']);
    $groups = slot_groups((int)$k['id']);
    $free = [];
    for ($r = 1; $r <= (int)$k['slots']; $r++) if (!in_array($r, $locked, true)) $free[] = $r;
    $bag = [];
    foreach ($free as $r) $bag[] = $groups[$r] ?? [];
    for ($i = count($bag) - 1; $i > 0; $i--) { $j = random_int(0, $i); [$bag[$i], $bag[$j]] = [$bag[$j], $bag[$i]]; }
    $rows = [];
    foreach ($groups as $r => $g) if (in_array($r, $locked, true)) foreach ($g as $h) $rows[] = $h;
    foreach ($free as $i => $r) foreach ($bag[$i] as $h) { $h['slot_no'] = $r; $rows[] = $h; }
    write_slots((int)$k['id'], (int)$k['slots'], $rows);
    json_out(['ok' => true]);

case 'slots/draw':
    // Draw every round: pick a random undecided number and bring it to this round.
    $u = require_user(['organizer', 'superadmin']);
    $k = kameti_for((int)in('kameti_id'), $u, true);
    $round = (int)in('round_no');
    $decided = array_map('intval', array_column(all('SELECT round_no FROM payouts WHERE kameti_id = ?', [$k['id']]), 'round_no'));
    if ($round < 1 || in_array($round, $decided, true)) fail('ROUND_ALREADY_DRAWN');
    $pool = [];
    for ($r = $round; $r <= (int)$k['slots']; $r++) if (!in_array($r, $decided, true)) $pool[] = $r;
    if (!$pool) fail('NO_MEMBERS_LEFT');
    $pick = $pool[random_int(0, count($pool) - 1)];
    swap_slots((int)$k['id'], $round, $pick);
    q('INSERT INTO payouts (kameti_id,round_no,member_id,amount,bid_amount,given,given_at,note) VALUES (?,?,?,?,?,?,?,?)', [$k['id'], $round, null, 0, 0, 0, null, 'draw']);
    $names = array_column(all('SELECT m.name FROM kameti_slots s JOIN kameti_members m ON m.id = s.member_id WHERE s.kameti_id = ? AND s.slot_no = ?', [$k['id'], $round]), 'name');
    json_out(['round' => $round, 'names' => $names]);

// ================= PAYMENTS =================
case 'payments/toggle':
    $u = require_user(['organizer', 'superadmin']);
    $k = kameti_for((int)in('kameti_id'), $u, true);
    $mid = (int)in('member_id');
    $round = (int)in('round_no');
    $paid = (bool)in('paid', true);
    if (!one('SELECT id FROM kameti_members WHERE id = ? AND kameti_id = ?', [$mid, $k['id']])) fail('NOT_FOUND', 404);
    q('DELETE FROM payments WHERE kameti_id = ? AND member_id = ? AND round_no = ?', [$k['id'], $mid, $round]);
    if ($paid) q('INSERT INTO payments (kameti_id,member_id,round_no,amount,paid_at,note) VALUES (?,?,?,?,?,?)',
        [$k['id'], $mid, $round, (float)in('amount', $k['amount']), now(), clean_str(in('note'), 255)]);
    json_out(['ok' => true]);

case 'payments/round':
    $u = require_user(['organizer', 'superadmin']);
    $k = kameti_for((int)in('kameti_id'), $u, true);
    $round = (int)in('round_no');
    $paid = (bool)in('paid', true);
    $amounts = (array)in('amounts', []);
    q('DELETE FROM payments WHERE kameti_id = ? AND round_no = ?', [$k['id'], $round]);
    if ($paid) foreach ($amounts as $mid => $amt) {
        if (one('SELECT id FROM kameti_members WHERE id = ? AND kameti_id = ?', [(int)$mid, $k['id']]))
            q('INSERT INTO payments (kameti_id,member_id,round_no,amount,paid_at) VALUES (?,?,?,?,?)', [$k['id'], (int)$mid, $round, (float)$amt, now()]);
    }
    json_out(['ok' => true]);

// ================= PAYOUTS =================
case 'payouts/save':
    $u = require_user(['organizer', 'superadmin']);
    $k = kameti_for((int)in('kameti_id'), $u, true);
    $round = (int)in('round_no');
    if ($round < 1 || $round > (int)$k['slots']) fail('MISSING_FIELDS');
    // Boli / need based: bring the chosen number to this round.
    $from = (int)in('swap_from', 0);
    if ($from && $from !== $round) {
        $locked = locked_rounds((int)$k['id']);
        if (in_array($from, $locked, true) || in_array($round, $locked, true)) fail('LOCKED');
        swap_slots((int)$k['id'], $round, $from);
    }
    $given = in('given') ? 1 : 0;
    q('DELETE FROM payouts WHERE kameti_id = ? AND round_no = ?', [$k['id'], $round]);
    q('INSERT INTO payouts (kameti_id,round_no,member_id,amount,bid_amount,given,given_at,note) VALUES (?,?,?,?,?,?,?,?)',
        [$k['id'], $round, null, (float)in('amount', 0), (float)in('bid_amount', 0), $given, $given ? now() : null, clean_str(in('note'), 255)]);
    $done = (int)one('SELECT COUNT(*) c FROM payouts WHERE kameti_id = ? AND given = 1', [$k['id']])['c'];
    if ($done >= (int)$k['slots']) q("UPDATE kametis SET status = 'completed' WHERE id = ?", [$k['id']]);
    elseif ($k['status'] === 'completed') q("UPDATE kametis SET status = 'active' WHERE id = ?", [$k['id']]);
    json_out(['ok' => true]);

case 'payouts/delete':
    $u = require_user(['organizer', 'superadmin']);
    $k = kameti_for((int)in('kameti_id'), $u, true);
    q('DELETE FROM payouts WHERE kameti_id = ? AND round_no = ?', [$k['id'], (int)in('round_no')]);
    if ($k['status'] === 'completed') q("UPDATE kametis SET status = 'active' WHERE id = ?", [$k['id']]);
    json_out(['ok' => true]);

default:
    fail('NOT_FOUND', 404);
}

function add_member(int $kid, string $name, ?string $phone, ?string $email, int $pos): int {
    $userId = null;
    if ($email) { $x = one('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [$email]); $userId = $x['id'] ?? null; }
    if (!$userId && $phone) { $x = one('SELECT id FROM users WHERE phone = ?', [$phone]); $userId = $x['id'] ?? null; }
    q('INSERT INTO kameti_members (kameti_id,user_id,name,phone,email,share,turn_no,position,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
        [$kid, $userId, $name, $phone, $email, 1, null, $pos, now()]);
    return (int)db()->lastInsertId();
}

function locked_rounds(int $kid): array {
    return array_map('intval', array_column(all('SELECT round_no FROM payouts WHERE kameti_id = ? AND given = 1', [$kid]), 'round_no'));
}

function slot_groups(int $kid): array {
    $g = [];
    foreach (all('SELECT slot_no, member_id, `portion` FROM kameti_slots WHERE kameti_id = ? ORDER BY slot_no, id', [$kid]) as $r) $g[(int)$r['slot_no']][] = $r;
    return $g;
}

function write_slots(int $kid, int $max, array $rows): void {
    q('DELETE FROM kameti_slots WHERE kameti_id = ?', [$kid]);
    foreach ($rows as $r) {
        $slot = (int)$r['slot_no'];
        $por = round((float)$r['portion'], 4);
        if ($slot < 1 || $slot > $max || $por <= 0 || $por > 1) continue;
        q('INSERT INTO kameti_slots (kameti_id, slot_no, member_id, `portion`) VALUES (?,?,?,?)', [$kid, $slot, (int)$r['member_id'], $por]);
    }
}

function swap_slots(int $kid, int $a, int $b): void {
    if ($a === $b) return;
    q('UPDATE kameti_slots SET slot_no = -1 WHERE kameti_id = ? AND slot_no = ?', [$kid, $a]);
    q('UPDATE kameti_slots SET slot_no = ? WHERE kameti_id = ? AND slot_no = ?', [$a, $kid, $b]);
    q('UPDATE kameti_slots SET slot_no = ? WHERE kameti_id = ? AND slot_no = -1', [$b, $kid]);
}
