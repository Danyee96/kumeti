<?php
// One-time installer: open https://your-domain.com/api/install.php after uploading.
declare(strict_types=1);
require __DIR__ . '/lib.php';

$msg = null; $ok = false; $err = null;
$installed = load_config() !== null;

if (!$installed && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $driver = ($_POST['driver'] ?? 'mysql') === 'sqlite' ? 'sqlite' : 'mysql';
    if ($driver === 'sqlite') {
        $cfg = ['driver' => 'sqlite', 'sqlite_path' => dirname(writable_config_path()) . '/kumeti-data.sqlite'];
    } else {
        $cfg = [
            'driver' => 'mysql',
            'host' => trim($_POST['host'] ?? 'localhost') ?: 'localhost',
            'port' => trim($_POST['port'] ?? '3306') ?: '3306',
            'database' => trim($_POST['database'] ?? ''),
            'username' => trim($_POST['username'] ?? ''),
            'password' => (string)($_POST['password'] ?? ''),
        ];
    }
    try {
        install_database($cfg, true);
        $path = writable_config_path();
        if (!file_put_contents($path, "<?php\n// Kumeti config, generated " . date('c') . "\nreturn " . var_export($cfg, true) . ";\n")) {
            throw new RuntimeException('Could not write config file: ' . $path);
        }
        @chmod($path, 0640);
        $ok = true;
        $installed = true;
    } catch (Throwable $e) {
        $err = $e->getMessage();
    }
}
?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kumeti installer</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#0F0A1F;color:#F5F3FF;display:grid;place-items:center;padding:24px;background-image:radial-gradient(circle at 20% 10%,rgba(108,92,231,.45),transparent 40%),radial-gradient(circle at 90% 90%,rgba(169,155,248,.35),transparent 40%)}
.card{width:100%;max-width:460px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:32px;backdrop-filter:blur(12px)}
h1{margin:0 0 4px;font-size:30px;background:linear-gradient(90deg,#C9BFFC,#8576F2,#6C5CE7);-webkit-background-clip:text;color:transparent}
p{color:#C4B5FD;margin:0 0 20px;line-height:1.6}label{display:block;font-size:13px;margin:14px 0 6px;color:#DDD6FE}
input,select{width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.3);color:#fff;font-size:15px}
button,a.btn{display:block;width:100%;margin-top:22px;padding:14px;border:0;border-radius:14px;font-size:16px;font-weight:700;color:#fff;cursor:pointer;text-align:center;text-decoration:none;background:linear-gradient(90deg,#A99BF8,#8576F2,#6C5CE7)}
.err{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.4);padding:12px;border-radius:12px;color:#FCA5A5;font-size:14px}
.ok{background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.4);padding:14px;border-radius:12px;color:#A7F3D0;font-size:14px;line-height:1.7}
code{background:rgba(0,0,0,.35);padding:2px 6px;border-radius:6px}.row{display:grid;grid-template-columns:2fr 1fr;gap:10px}
</style></head><body><div class="card">
<h1>kumeti</h1>
<?php if ($ok): ?>
  <p>Installation complete.</p>
  <div class="ok">Demo accounts:<br>
  Super admin: <code>admin@kumeti.pk</code> / <code>admin123</code><br>
  Organizer: <code>organizer@kumeti.pk</code> / <code>organizer123</code><br>
  Member: <code>member@kumeti.pk</code> / <code>member123</code><br><br>
  Login ke baad super admin ka password zaroor badlein.</div>
  <a class="btn" href="../">Open app</a>
<?php elseif ($installed): ?>
  <p>Kumeti pehle se install hai. Dobara install karne ke liye <code>kumeti-config.php</code> file (public_html ke bahar) delete karein.</p>
  <a class="btn" href="../">Open app</a>
<?php else: ?>
  <p>Hostinger hPanel &rarr; Databases &rarr; MySQL mein ek database banayein, phir details yahan dalein.</p>
  <?php if ($err): ?><div class="err"><?= htmlspecialchars($err) ?></div><?php endif; ?>
  <form method="post">
    <label>Database type</label>
    <select name="driver" onchange="document.getElementById('my').style.display=this.value==='mysql'?'block':'none'">
      <option value="mysql">MySQL (recommended)</option>
      <option value="sqlite">SQLite (no setup, small use)</option>
    </select>
    <div id="my">
      <div class="row"><div><label>Host</label><input name="host" value="localhost"></div><div><label>Port</label><input name="port" value="3306"></div></div>
      <label>Database name</label><input name="database" placeholder="u123456789_kumeti">
      <label>Username</label><input name="username" placeholder="u123456789_kumeti">
      <label>Password</label><input name="password" type="password">
    </div>
    <button type="submit">Install Kumeti</button>
  </form>
<?php endif; ?>
</div></body></html>
