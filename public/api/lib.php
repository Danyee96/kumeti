<?php
// Kumeti API core: config, database, auth helpers.
declare(strict_types=1);

const KUMETI_VERSION = '1.0.0';

function config_paths(): array {
    // Config lives one level ABOVE the web root (public_html) so Git redeploys never overwrite it.
    return [
        dirname(__DIR__, 2) . '/kumeti-config.php',
        __DIR__ . '/config.php',
    ];
}

function load_config(): ?array {
    foreach (config_paths() as $p) {
        if (is_file($p)) {
            $c = require $p;
            if (is_array($c)) return $c;
        }
    }
    return null;
}

function writable_config_path(): string {
    $outside = dirname(__DIR__, 2);
    if (is_dir($outside) && is_writable($outside)) return $outside . '/kumeti-config.php';
    return __DIR__ . '/config.php';
}

function connect(array $c): PDO {
    if (($c['driver'] ?? 'mysql') === 'sqlite') {
        $pdo = new PDO('sqlite:' . $c['sqlite_path']);
        $pdo->exec('PRAGMA foreign_keys = ON');
    } else {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $c['host'] ?? 'localhost', $c['port'] ?? '3306', $c['database']);
        $pdo = new PDO($dsn, $c['username'], $c['password']);
    }
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    return $pdo;
}

function schema(string $driver): array {
    $id   = $driver === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT UNSIGNED AUTO_INCREMENT PRIMARY KEY';
    $ref  = $driver === 'sqlite' ? 'INTEGER' : 'INT UNSIGNED';
    $long = $driver === 'sqlite' ? 'TEXT' : 'LONGTEXT';
    $tail = $driver === 'sqlite' ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    return [
        "CREATE TABLE IF NOT EXISTS users (
            id $id,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(160) NULL,
            phone VARCHAR(40) NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'member',
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            lang VARCHAR(5) NOT NULL DEFAULT 'en',
            created_at VARCHAR(25) NOT NULL
        )$tail",
        "CREATE TABLE IF NOT EXISTS sessions (
            token VARCHAR(80) PRIMARY KEY,
            user_id $ref NOT NULL,
            expires_at VARCHAR(25) NOT NULL
        )$tail",
        "CREATE TABLE IF NOT EXISTS settings (
            skey VARCHAR(60) PRIMARY KEY,
            svalue $long NULL
        )$tail",
        "CREATE TABLE IF NOT EXISTS kametis (
            id $id,
            organizer_id $ref NOT NULL,
            title VARCHAR(160) NOT NULL,
            type VARCHAR(20) NOT NULL,
            frequency VARCHAR(10) NOT NULL DEFAULT 'monthly',
            amount DECIMAL(14,2) NOT NULL,
            slots INT NOT NULL,
            start_date VARCHAR(10) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            config $long NULL,
            notes $long NULL,
            created_at VARCHAR(25) NOT NULL
        )$tail",
        "CREATE TABLE IF NOT EXISTS kameti_members (
            id $id,
            kameti_id $ref NOT NULL,
            user_id $ref NULL,
            name VARCHAR(120) NOT NULL,
            phone VARCHAR(40) NULL,
            email VARCHAR(160) NULL,
            share DECIMAL(4,2) NOT NULL DEFAULT 1,
            turn_no INT NULL,
            position INT NOT NULL DEFAULT 0,
            created_at VARCHAR(25) NOT NULL
        )$tail",
        "CREATE TABLE IF NOT EXISTS payments (
            id $id,
            kameti_id $ref NOT NULL,
            member_id $ref NOT NULL,
            round_no INT NOT NULL,
            amount DECIMAL(14,2) NOT NULL,
            paid_at VARCHAR(25) NOT NULL,
            note VARCHAR(255) NULL
        )$tail",
        "CREATE TABLE IF NOT EXISTS payouts (
            id $id,
            kameti_id $ref NOT NULL,
            round_no INT NOT NULL,
            member_id $ref NULL,
            amount DECIMAL(14,2) NOT NULL DEFAULT 0,
            bid_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
            given INT NOT NULL DEFAULT 0,
            given_at VARCHAR(25) NULL,
            note VARCHAR(255) NULL
        )$tail",
        // One row per (number, holder). Several rows with the same slot_no = a split number.
        // One member on several slot_no = a member with more than one number.
        "CREATE TABLE IF NOT EXISTS kameti_slots (
            id $id,
            kameti_id $ref NOT NULL,
            slot_no INT NOT NULL,
            member_id $ref NOT NULL,
            `portion` DECIMAL(6,4) NOT NULL DEFAULT 1
        )$tail",
    ];
}

const SCHEMA_VERSION = 2;

// Creates missing tables and moves old turn_no/share data into kameti_slots.
function migrate(PDO $pdo, string $driver): void {
    try {
        $v = $pdo->query("SELECT svalue FROM settings WHERE skey = 'schema_version'")->fetchColumn();
    } catch (Throwable $e) { $v = false; }
    if ((int)json_decode((string)$v) >= SCHEMA_VERSION) return;
    foreach (schema($driver) as $sql) $pdo->exec($sql);
    if ((int)$pdo->query('SELECT COUNT(*) FROM kameti_slots')->fetchColumn() === 0) {
        $rows = $pdo->query('SELECT id, kameti_id, turn_no, share FROM kameti_members WHERE turn_no IS NOT NULL')->fetchAll(PDO::FETCH_ASSOC);
        $ins = $pdo->prepare('INSERT INTO kameti_slots (kameti_id, slot_no, member_id, `portion`) VALUES (?,?,?,?)');
        foreach ($rows as $r) $ins->execute([$r['kameti_id'], $r['turn_no'], $r['id'], $r['share'] ?: 1]);
    }
    $pdo->prepare('DELETE FROM settings WHERE skey = ?')->execute(['schema_version']);
    $pdo->prepare('INSERT INTO settings (skey, svalue) VALUES (?, ?)')->execute(['schema_version', (string)SCHEMA_VERSION]);
}

function now(): string { return gmdate('Y-m-d H:i:s'); }

function install_database(array $cfg, bool $seed = true): void {
    $pdo = connect($cfg);
    foreach (schema($cfg['driver']) as $sql) $pdo->exec($sql);
    migrate($pdo, $cfg['driver']);
    if ($seed && (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() === 0) {
        seed_demo($pdo);
    }
}

function seed_demo(PDO $pdo): void {
    $ins = $pdo->prepare('INSERT INTO users (name,email,phone,password_hash,role,status,lang,created_at) VALUES (?,?,?,?,?,?,?,?)');
    $ins->execute(['Super Admin', 'admin@kumeti.pk', '03000000000', password_hash('admin123', PASSWORD_DEFAULT), 'superadmin', 'active', 'en', now()]);
    $ins->execute(['Ahmed Organizer', 'organizer@kumeti.pk', '03001111111', password_hash('organizer123', PASSWORD_DEFAULT), 'organizer', 'active', 'en', now()]);
    $orgId = (int)$pdo->lastInsertId();
    $ins->execute(['Bilal Member', 'member@kumeti.pk', '03002222222', password_hash('member123', PASSWORD_DEFAULT), 'member', 'active', 'en', now()]);
    $memUserId = (int)$pdo->lastInsertId();

    $start = date('Y-m-01', strtotime('-2 months'));
    $k = $pdo->prepare('INSERT INTO kametis (organizer_id,title,type,frequency,amount,slots,start_date,status,config,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    $k->execute([$orgId, 'Mohalla Kameti 2026', 'qurandazi', 'monthly', 10000, 6, $start, 'active',
        json_encode(['draw_mode' => 'all_at_once', 'due_day' => 5, 'late_fee' => 200, 'organizer_fee' => 0]), 'Demo kameti', now()]);
    $kid = (int)$pdo->lastInsertId();
    // Bilal holds 2 numbers, number 4 is split between Sana and Usman.
    $names = [['Ayesha Khan', null, null], ['Fatima Noor', null, null], ['Bilal Member', $memUserId, 'member@kumeti.pk'], ['Sana Iqbal', null, null], ['Usman Ali', null, null], ['Hamza Raza', null, null]];
    $m = $pdo->prepare('INSERT INTO kameti_members (kameti_id,user_id,name,phone,email,share,turn_no,position,created_at) VALUES (?,?,?,?,?,?,?,?,?)');
    $ids = [];
    foreach ($names as $i => $n) {
        $m->execute([$kid, $n[1], $n[0], '0300' . rand(1000000, 9999999), $n[2], 1, null, $i, now()]);
        $ids[] = (int)$pdo->lastInsertId();
    }
    [$ayesha, $fatima, $bilal, $sana, $usman, $hamza] = $ids;
    $holdings = [[1, $ayesha, 1], [2, $fatima, 1], [3, $bilal, 1], [4, $sana, .5], [4, $usman, .5], [5, $hamza, 1], [6, $bilal, 1]];
    $h = $pdo->prepare('INSERT INTO kameti_slots (kameti_id, slot_no, member_id, `portion`) VALUES (?,?,?,?)');
    foreach ($holdings as [$slot, $mid, $por]) $h->execute([$kid, $slot, $mid, $por]);
    $due = [$ayesha => 10000, $fatima => 10000, $bilal => 20000, $sana => 5000, $usman => 5000, $hamza => 10000];
    $p = $pdo->prepare('INSERT INTO payments (kameti_id,member_id,round_no,amount,paid_at) VALUES (?,?,?,?,?)');
    $i = 0;
    foreach ($due as $mid => $amt) {
        $p->execute([$kid, $mid, 1, $amt, now()]);
        $p->execute([$kid, $mid, 2, $amt, now()]);
        if ($i++ < 3) $p->execute([$kid, $mid, 3, $amt, now()]);
    }
    $po = $pdo->prepare('INSERT INTO payouts (kameti_id,round_no,member_id,amount,bid_amount,given,given_at) VALUES (?,?,?,?,?,?,?)');
    $po->execute([$kid, 1, null, 60000, 0, 1, now()]);
    $po->execute([$kid, 2, null, 60000, 0, 1, now()]);
}

// ---------- HTTP helpers ----------
function json_out($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function fail(string $msg, int $code = 400): void { json_out(['error' => $msg], $code); }

function body(): array {
    static $b = null;
    if ($b === null) {
        $raw = file_get_contents('php://input');
        $b = $raw ? (json_decode($raw, true) ?: []) : [];
    }
    return $b;
}
function in(string $k, $default = null) {
    $b = body();
    return array_key_exists($k, $b) ? $b[$k] : ($_GET[$k] ?? $default);
}

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $cfg = load_config();
    if (!$cfg && PHP_SAPI === 'cli-server') {
        // Local development: auto-create a SQLite database with demo data.
        $cfg = ['driver' => 'sqlite', 'sqlite_path' => dirname(__DIR__, 2) . '/kumeti-data.sqlite'];
        file_put_contents(dirname(__DIR__, 2) . '/kumeti-config.php', "<?php\nreturn " . var_export($cfg, true) . ";\n");
        install_database($cfg);
    }
    if (!$cfg) fail('NOT_INSTALLED', 503);
    $pdo = connect($cfg);
    migrate($pdo, $cfg['driver'] ?? 'mysql');
    return $pdo;
}

function q(string $sql, array $params = []): PDOStatement {
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}
function one(string $sql, array $p = []): ?array { $r = q($sql, $p)->fetch(); return $r ?: null; }
function all(string $sql, array $p = []): array { return q($sql, $p)->fetchAll(); }

function setting(string $key, $default = null) {
    $r = one('SELECT svalue FROM settings WHERE skey = ?', [$key]);
    if (!$r) return $default;
    $v = json_decode((string)$r['svalue'], true);
    return $v === null ? $default : $v;
}
function set_setting(string $key, $value): void {
    q('DELETE FROM settings WHERE skey = ?', [$key]);
    q('INSERT INTO settings (skey, svalue) VALUES (?, ?)', [$key, json_encode($value, JSON_UNESCAPED_UNICODE)]);
}

// ---------- auth ----------
function token_header(): ?string {
    $h = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? null;
    if (!$h && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) if (strtolower($k) === 'x-auth-token') $h = $v;
    }
    return $h ?: ($_GET['token'] ?? null);
}

function current_user(): ?array {
    static $u = false;
    if ($u !== false) return $u;
    $t = token_header();
    $u = null;
    if ($t) {
        $u = one('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?', [$t, now()]);
        if ($u && $u['status'] !== 'active') $u = null;
    }
    return $u;
}

function require_user(array $roles = []): array {
    $u = current_user();
    if (!$u) fail('UNAUTHORIZED', 401);
    if ($roles && !in_array($u['role'], $roles, true)) fail('FORBIDDEN', 403);
    return $u;
}

function public_user(array $u): array {
    unset($u['password_hash']);
    $u['id'] = (int)$u['id'];
    return $u;
}

function make_session(int $userId): string {
    $t = bin2hex(random_bytes(32));
    q('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)', [$t, $userId, gmdate('Y-m-d H:i:s', time() + 60 * 60 * 24 * 30)]);
    return $t;
}

// ---------- kameti access ----------
function kameti_for(int $id, array $u, bool $write = false): array {
    $k = one('SELECT * FROM kametis WHERE id = ?', [$id]);
    if (!$k) fail('NOT_FOUND', 404);
    if ($u['role'] === 'superadmin') return $k;
    if ((int)$k['organizer_id'] === (int)$u['id']) return $k;
    if (!$write && $u['role'] === 'member') {
        $m = one('SELECT id FROM kameti_members WHERE kameti_id = ? AND (user_id = ? OR (email IS NOT NULL AND email <> \'\' AND LOWER(email) = LOWER(?)))', [$id, $u['id'], (string)$u['email']]);
        if ($m) return $k;
    }
    fail('FORBIDDEN', 403);
}

function clean_str($v, int $max = 255): ?string {
    if ($v === null) return null;
    $v = trim((string)$v);
    return $v === '' ? null : mb_substr($v, 0, $max);
}
