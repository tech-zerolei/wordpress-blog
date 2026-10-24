<?php
if (!defined('ABSPATH')) { exit; }
/** 全站默认配置。装饰效果全部关闭；访客可在浏览器中单独开启。 */
return [
    'enabled' => true,
    'effects' => [
        'petals' => false,
        'clickStars' => false,
        'cardLift' => false,
        'heroGlow' => false,
        'glassNav' => false,
        'readingProgress' => false,
    ],
    'petalsDesktop' => 14,
    'petalsMobile' => 5,
    'pixelRatioMax' => 1.5,
    'maxFps' => 30,
];
