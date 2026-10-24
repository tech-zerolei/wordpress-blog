<?php
/**
 * Plugin Name: Zero Anime — 阅读优先美化
 * Description: Argon 独立增强层。设置 → Zero 二次元美化；不改主题、不添加看板娘。
 * Version: 2.0.0
 * License: GPL-2.0-or-later
 */
if (!defined('ABSPATH')) { exit; }
if ((defined('ZERO_ANIME_DISABLED') && ZERO_ANIME_DISABLED) || is_file(__DIR__ . '/zero-anime/disabled.flag')) { return; }
require_once __DIR__ . '/zero-anime/plugin.php';
