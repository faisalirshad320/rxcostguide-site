<?php
/**
 * Root entry shim. The site is a static build (index.html per directory).
 * Cloudways' Nginx uses `try_files ... /index.php`, so every unmatched URL
 * reaches this file. Serve the homepage only for the root; return a real 404
 * (not the homepage) for anything else, so stale/old URLs de-index cleanly and
 * we don't create soft-404s.
 */
$path = rtrim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/', '/');

if ($path === '' || $path === '/index' || $path === '/index.php' || $path === '/index.html') {
    header('Content-Type: text/html; charset=utf-8');
    readfile(__DIR__ . '/index.html');
    exit;
}

http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
readfile(__DIR__ . '/404.html');
