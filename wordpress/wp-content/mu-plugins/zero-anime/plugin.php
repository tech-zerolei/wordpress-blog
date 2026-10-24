<?php
namespace ZeroAnime;
if (!defined('ABSPATH')) { exit; }
const VERSION = '2.0.0';
function labels(): array {
    return ['petals'=>'横幅樱花飘落','clickStars'=>'空白处点击星光','cardLift'=>'文章卡片轻悬浮','heroGlow'=>'横幅柔光呼吸','glassNav'=>'导航磨砂玻璃','readingProgress'=>'文章阅读进度条'];
}
function options(): array {
    $default = require __DIR__ . '/config.php';
    $saved = get_option('zero_anime_options', []);
    if (!is_array($saved)) { return $default; }
    if (isset($saved['enabled'])) { $default['enabled'] = (bool)$saved['enabled']; }
    foreach (labels() as $key => $label) {
        if (isset($saved['effects'][$key])) { $default['effects'][$key] = (bool)$saved['effects'][$key]; }
    }
    return $default;
}
function active(): bool { return get_template() === 'argon' && options()['enabled']; }
function sanitize($input): array {
    $input = is_array($input) ? $input : [];
    $out = ['enabled'=>!empty($input['enabled']), 'effects'=>[]];
    foreach (labels() as $key=>$label) { $out['effects'][$key] = !empty($input['effects'][$key]); }
    return $out;
}
add_action('admin_init', static function () {
    register_setting('zero_anime', 'zero_anime_options', ['type'=>'array','sanitize_callback'=>__NAMESPACE__.'\\sanitize','default'=>[]]);
});
add_action('admin_menu', static function () {
    add_options_page('Zero 二次元美化','Zero 二次元美化','manage_options','zero-anime',__NAMESPACE__.'\\settings_page');
});
function settings_page(): void {
    if (!current_user_can('manage_options')) { return; }
    $config=options(); ?>
    <div class="wrap"><h1>Zero 二次元美化 <small>2.0</small></h1>
    <p>保留 Argon 和原站内容，无看板娘、无外部字体或特效依赖。装饰默认关闭。</p>
    <?php settings_errors(); ?>
    <form action="options.php" method="post">
    <?php settings_fields('zero_anime'); ?>
    <table class="form-table" role="presentation"><tr><th scope="row">增强层总开关</th><td>
    <input type="hidden" name="zero_anime_options[enabled]" value="0">
    <label><input type="checkbox" name="zero_anime_options[enabled]" value="1" <?php checked($config['enabled']); ?>>启用（关闭后恢复原有主题与原内联美化代码）</label></td></tr>
    <tr><th scope="row">访客默认特效</th><td><fieldset><legend class="screen-reader-text">访客默认特效</legend>
    <?php foreach(labels() as $key=>$label): ?>
    <input type="hidden" name="zero_anime_options[effects][<?php echo esc_attr($key); ?>]" value="0">
    <label style="display:block;margin:10px 0"><input type="checkbox" name="zero_anime_options[effects][<?php echo esc_attr($key); ?>]" value="1" <?php checked($config['effects'][$key]); ?>><?php echo esc_html($label); ?></label>
    <?php endforeach; ?></fieldset><p class="description">每位访客可通过右下角「阅读偏好」覆盖默认值；「恢复站点默认」会移除本地覆盖。系统减少动态效果和省流量设置优先。</p></td></tr></table>
    <?php submit_button(); ?></form>
    <h2>维护与紧急回滚</h2><p>配置：<code>wp-content/mu-plugins/zero-anime/config.php</code>。暂时停用：创建 <code>wp-content/mu-plugins/zero-anime/disabled.flag</code>。MU 插件不能在普通插件列表直接停用。</p>
    <p>本增强层只兼容 Argon；切换主题时自动停止加载，不修改文章或评论。</p></div>
<?php }
// 只屏蔽已识别的旧增强层输出；数据库原值完整保留，关闭插件立即恢复。
add_filter('option_argon_custom_html_foot', static function ($html) {
    return active() && is_string($html) && strpos($html,'Zero Sakura 1.0.0') !== false ? '' : $html;
});
add_filter('wp_get_custom_css', static function ($css, $stylesheet) {
    return active() && $stylesheet==='argon' && strpos($css,'Zero · Sakura notebook.') !== false ? '' : $css;
}, 20, 2);
// 主题自带装饰动画也默认关闭，不落库。
foreach(['argon_enable_banner_title_typing_effect'=>'false','argon_enable_into_article_animation'=>'false','argon_disable_pjax_animation'=>'true','argon_toolbar_blur'=>'false','argon_enable_smoothscroll_type'=>'disabled'] as $name=>$value) {
    add_filter('option_'.$name, static function ($old) use ($value) { return active() ? $value : $old; });
}
add_filter('option_argon_theme_color', static function ($color) { return active() ? '#95506b' : $color; });
add_action('wp_enqueue_scripts', static function () {
    if (!active()) { return; }
    $base=plugins_url('zero-anime/',dirname(__DIR__).'/zero-anime.php');
    wp_enqueue_style('zero-anime',$base.'style.css',[],VERSION.'-'.substr(hash_file('sha256',__DIR__.'/style.css'),0,12));
    wp_enqueue_script('zero-anime',$base.'main.js',[],VERSION.'-'.substr(hash_file('sha256',__DIR__.'/main.js'),0,12),true);
    $config=options();
    $config['version']=VERSION;
    $config['modulesUrl']=$base.'modules/';
    $config['artUrl']=$base.'assets/sakura-dusk.svg';
    $config['homeUrl']=home_url('/');
    wp_add_inline_script('zero-anime','window.ZeroAnimeConfig='.wp_json_encode($config,JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT).';','before');
},99);
add_action('wp_head',static function () {
    if (!active()) { return; }
    // 尽早同步配色，避免亮暗闪烁；不继承旧版默认开启的特效。
    echo '<script id="zero-anime-theme">try{var m=localStorage.getItem("zero-anime-mode-v2")||localStorage.getItem("zero-sakura-mode")||"system";document.documentElement.classList.toggle("darkmode",m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches));}catch(e){}</script>';
},2);
