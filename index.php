<?php
/**
 * Legacy-router replacement. The site is now a static build (index.html per directory).
 * Cloudways' Nginx picks index.php ahead of index.html at the web root, so this shim
 * simply serves the static homepage. All other pages are served directly as index.html.
 */
http_response_code(200);
header('Content-Type: text/html; charset=utf-8');
readfile(__DIR__ . '/index.html');
