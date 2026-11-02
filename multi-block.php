<?php

/**
 * Plugin Name: WP Arda-Report
 * Plugin URI:  https://ardagan.fr
 * Description: integration of compoment in MQ for your WordPress sites for Reporting.
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           1.1.0-rc.2
 * Author:            Damien Grassone
 * Author URI:  https://ardagan.fr
 * License:     GPL 3.0
 * License URI: http://www.gnu.org/licenses/gpl-3.0.txt
 * Text Domain:       multi-block
 * Update URI:        https://github.com/Ardaganbao/mose-wordpress
 *
 * @package           create-block
 */

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */
if (!defined('WPINC')) {
    die;
}

// Updates from GitHub: each release of Ardaganbao/mose-wordpress (not a pre-release) with its
// multi-block.zip shows as an update on the Plugins page. The version is the Version above.
require __DIR__ . '/plugin-update-checker/plugin-update-checker.php';
$ardareport_update_checker = \YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
    'https://github.com/Ardaganbao/mose-wordpress/',
    __FILE__,
    'multi-block'
);
$ardareport_update_checker->getVcsApi()->enableReleaseAssets('/multi-block\.zip($|[?&#])/i');

function create_block_multi_block_block_init()
{
    register_block_type(__DIR__ . '/build/Client');
    register_block_type(__DIR__ . '/build/Title');
    register_block_type(__DIR__ . '/build/version');
    register_block_type(__DIR__ . '/build/arda_MQ');
    register_block_type(__DIR__ . '/build/Introduction');
    register_block_type(__DIR__ . '/build/Social');
}

// The rewrite rules of the Reports post type are rebuilt once after the plugin is installed or
// updated (this file changes), after the post types are registered, instead of on every page load.
add_action('init', function () {
    $stamp = (string) filemtime(__FILE__);
    if (get_option('ardareport_rewrite_stamp') !== $stamp) {
        flush_rewrite_rules();
        update_option('ardareport_rewrite_stamp', $stamp);
    }
}, 20);
add_action('wp_print_footer_scripts', 'front_print_footer_scripts');


//Ardareport_type constants 
define('ARDAREPORT_MENU_LABEL', 'Reports');
define('ARDAREPORT_MENU_LABEL_slug', 'reports');

define('ARDAREPORT_POST_TYPE', 'Report');
define('ARDAREPORT_POST_TYPE_LABEL', 'Reports');
define('ARDAREPORT_POST_TYPE_LABEL_singular', 'Report');

define('ARDAREPORT_META_BOX_KEY', 'Report_Meta_key');
define('ARDAREPORT_META_BOX_LABEL', 'Report information');


define('ARDAREPORT_Title_META_KEY', '_report_title');
define('ARDAREPORT_Client_META_KEY', '_report_client');
define('ARDAREPORT_Title_META_LABEL', 'Title');
define('ARDAREPORT_Client_META_LABEL', 'Customer');
define('ARDAREPORT_CONTEXT_META_KEY', '_report_context');
define('ARDAREPORT_CONTEXT_META_LABEL', 'Context');
define('ARDAREPORT_Historical_META_KEY', '_report_Historical');
define('ARDAREPORT_Historical_META_LABEL', 'Show Revision');


define('ARDAREPORT_NONCE_ACTION', 'ardareport_nonce_action');
define('ARDAREPORT_NONCE_NAME', 'ardareport_nonce_name');

define('ARDACUSTOMER_POST_TYPE', 'Customer');
define('ARDACUSTOMER_POST_TYPE_LABEL', 'Customers');
define('ARDACUSTOMER_POST_TYPE_LABEL_singular', 'Customer');

define('ARDACUSTOMER_META_BOX_KEY', 'Customer_Meta_key');
define('ARDACUSTOMER_META_BOX_LABEL', 'Customer information');
define('ARDACUSTOMER_ADDRESS_META_KEY', '_report_address');
define('ARDACUSTOMER_ADDRESS_META_LABEL', 'Address');
define('ARDACUSTOMER_NONCE_ACTION', 'ardacustomer_nonce_action');
define('ARDACUSTOMER_NONCE_NAME', 'ardacustomer_nonce_name');

define('ARDACUSTOMER_SQL', "SELECT * FROM $wpdb->postmeta WHERE meta_key = %s AND meta_value = %s AND post_id <> %d");


define( 'ARDAREPORT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
//to start dev
//  npx wp-env start --update
//  cd .\multi-block\
//  npm run start

define('ARDAREPORT_SQL', "SELECT * FROM $wpdb->postmeta WHERE meta_key = %s AND meta_value = %s AND post_id <> %d");
function add_your_menu()
{
    add_menu_page(ARDAREPORT_MENU_LABEL, ARDAREPORT_MENU_LABEL, 'manage_options', ARDAREPORT_MENU_LABEL_slug, '__return_null', 'dashicons-format-aside', 5);
    // add_submenu_page() if you want subpages, but not necessary
}
add_action('admin_menu', 'add_your_menu');
// The Reports menu has no page of its own: it opens the list of reports.
add_action('load-toplevel_page_' . ARDAREPORT_MENU_LABEL_slug, function () {
    wp_safe_redirect(admin_url('edit.php?post_type=' . sanitize_key(ARDAREPORT_POST_TYPE)));
    exit;
});
// add Ardareport_type
add_action('init', function () {
    $labels = array(
        'name'               => ARDAREPORT_POST_TYPE_LABEL,
        'singular_name'      => ARDAREPORT_POST_TYPE_LABEL_singular,
        'menu_name'          => ARDAREPORT_POST_TYPE_LABEL,
        'name_admin_bar'     => ARDAREPORT_POST_TYPE_LABEL,
        'add_new'            => 'Add New ' . ARDAREPORT_POST_TYPE_LABEL_singular,
        'add_new_item'       => 'Add New  ' . ARDAREPORT_POST_TYPE_LABEL_singular,
        'new_item'           => 'New  ' . ARDAREPORT_POST_TYPE_LABEL_singular,
        'edit_item'          => 'Edit  ' . ARDAREPORT_POST_TYPE_LABEL_singular,
        'view_item'          => 'View ' . ARDAREPORT_POST_TYPE_LABEL_singular,
        'all_items'          => 'All ' . ARDAREPORT_POST_TYPE_LABEL,
        'search_items'       => 'Search  ' . ARDAREPORT_POST_TYPE_LABEL_singular,
        'parent_item_colon'  => 'Parent  ' . ARDAREPORT_POST_TYPE_LABEL_singular,
        'not_found'          => 'No  ' . ARDAREPORT_POST_TYPE_LABEL . ' Found',
        'not_found_in_trash' => 'No ' . ARDAREPORT_POST_TYPE_LABEL . ' Found in Trash'
    );
    register_post_type(ARDAREPORT_POST_TYPE, [
        'labels' => $labels,
        'public' => true,
        'menu_icon' => 'dashicons-format-aside',
        'show_in_rest'       => true,
        'exclude_from_search' => false,
        'show_ui'             => true,
        // 'show_in_nav_menus'   => true,
        'show_in_menu'        => ARDAREPORT_MENU_LABEL_slug,
        'show_in_admin_bar'   => true,
        'menu_position'       => 5,
        'capability_type'     => 'post',
        'hierarchical'        => false,
        'supports'            => array('title', 'editor', 'author', 'thumbnail', 'revisions'),
        'taxonomies' => array('category','post_tag'),
        'has_archive'         => true,
        'rewrite'             => array( 'slug' => ARDAREPORT_MENU_LABEL_slug, 'with_front'=>true),
		//'rewrite' => false,
        'query_var'           => true

    ]);
    $labels = array(
        'name'               => ARDACUSTOMER_POST_TYPE_LABEL,
        'singular_name'      => ARDACUSTOMER_POST_TYPE_LABEL_singular,
        'menu_name'          => ARDACUSTOMER_POST_TYPE_LABEL,
        'name_admin_bar'     => ARDACUSTOMER_POST_TYPE_LABEL,
        'add_new'            => 'Add New ' . ARDACUSTOMER_POST_TYPE_LABEL_singular,
        'add_new_item'       => 'Add New  ' . ARDACUSTOMER_POST_TYPE_LABEL_singular,
        'new_item'           => 'New  ' . ARDACUSTOMER_POST_TYPE_LABEL_singular,
        'edit_item'          => 'Edit  ' . ARDACUSTOMER_POST_TYPE_LABEL_singular,
        'view_item'          => 'View ' . ARDACUSTOMER_POST_TYPE_LABEL_singular,
        'all_items'          => 'All ' . ARDACUSTOMER_POST_TYPE_LABEL,
        'search_items'       => 'Search  ' . ARDACUSTOMER_POST_TYPE_LABEL_singular,
        'parent_item_colon'  => 'Parent  ' . ARDACUSTOMER_POST_TYPE_LABEL_singular,
        'not_found'          => 'No  ' . ARDACUSTOMER_POST_TYPE_LABEL . ' Found',
        'not_found_in_trash' => 'No ' . ARDACUSTOMER_POST_TYPE_LABEL . ' Found in Trash'
    );
    register_post_type(ARDACUSTOMER_POST_TYPE, [
        'labels' => $labels,
        'public' => false,
        'menu_name' => ARDAREPORT_MENU_LABEL,
        'menu_icon' => 'dashicons-businessman',
        'show_in_rest'       => true,
        'exclude_from_search' => false,
        'show_ui'             => true,
        // 'show_in_nav_menus'   => true,
        'show_in_menu'        => ARDAREPORT_MENU_LABEL_slug,
        'show_in_admin_bar'   => true,
        'menu_position'       => null,
        'capability_type'     => 'post',
        'hierarchical'        => false,
        'supports'            => array('title',  'thumbnail' ),
        'has_archive'         => true,
        'rewrite'             => false,
        'query_var'           => true
    ]);
});


// add the custom field for ArdaCustomer_type
add_action('add_meta_boxes', function () {
    add_meta_box(ARDACUSTOMER_META_BOX_KEY, ARDACUSTOMER_META_BOX_LABEL, function (WP_Post $post) {
        wp_nonce_field(ARDACUSTOMER_NONCE_ACTION, ARDACUSTOMER_NONCE_NAME);
        $attributes = [
            'id' => ARDACUSTOMER_ADDRESS_META_KEY,
            'name' => ARDACUSTOMER_ADDRESS_META_KEY,
            'class' => 'widefat arda' . ARDACUSTOMER_ADDRESS_META_KEY,
            'type' => 'text',
            //'type' => 'url',
            'required' => 'required'
        ];

        $attributes = implode(' ', array_map(function ($key) use ($attributes) {
            return sprintf('%s="%s"', $key, esc_attr($attributes[$key]));
        }, array_keys($attributes)));
        $value = get_post_meta($post->ID, ARDACUSTOMER_ADDRESS_META_KEY, true);
        echo '<label for=' . ARDACUSTOMER_ADDRESS_META_KEY . '>' . ARDACUSTOMER_ADDRESS_META_LABEL . '</label>';
        $settings =   array(
            'wpautop' => true,              // Whether to use wpautop for adding in paragraphs. Note that the paragraphs are added automatically when wpautop is false.
            'media_buttons' => true,        // Whether to display media insert/upload buttons
            'textarea_name' => ARDACUSTOMER_ADDRESS_META_KEY,       // The name assigned to the generated textarea and passed parameter when the form is submitted.
            'textarea_rows' => 10,          // The number of rows to display for the textarea
            'tabindex' => '',               // The tabindex value used for the form field
            'editor_css' => '',             // Additional CSS styling applied for both visual and HTML editors buttons, needs to include <style> tags, can use "scoped"
            'editor_class' => '',           // Any extra CSS Classes to append to the Editor textarea
            'teeny' => false,               // Whether to output the minimal editor configuration used in PressThis
            'dfw' => false,                 // Whether to replace the default fullscreen editor with DFW (needs specific DOM elements and CSS)
            'tinymce' => true,              // Load TinyMCE, can be used to pass settings directly to TinyMCE using an array
            'quicktags' => true,            // Load Quicktags, can be used to pass settings directly to Quicktags using an array. Set to false to remove your editor's Visual and Text tabs.
            'drag_drop_upload' => false     // Enable Drag & Drop Upload Support (since WordPress 3.9)
        );
        wp_editor($value, ARDACUSTOMER_ADDRESS_META_KEY, $settings);
    }, ARDACUSTOMER_POST_TYPE, 'advanced', 'core');
});
//hook the save action for ArdaCustomer_type
add_action('save_post', function ($post_id) {
    if (!isset($_POST[ARDACUSTOMER_NONCE_NAME])) return;
    if (!wp_verify_nonce($_POST[ARDACUSTOMER_NONCE_NAME], ARDACUSTOMER_NONCE_ACTION)) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!isset($_POST[ARDACUSTOMER_ADDRESS_META_KEY])) return;
    if (!current_user_can('edit_post', $post_id)) return;

    // Shown as HTML in the reports: keep only the HTML allowed in a post, no scripts.
    update_post_meta($post_id, ARDACUSTOMER_ADDRESS_META_KEY, wp_kses_post(wp_unslash($_POST[ARDACUSTOMER_ADDRESS_META_KEY])));
});
// add the custom field for Ardareport_type
add_action('add_meta_boxes', function () {
    add_meta_box(ARDAREPORT_META_BOX_KEY, ARDAREPORT_META_BOX_LABEL, function (WP_Post $post) {
        // add title field
        wp_nonce_field(ARDAREPORT_NONCE_ACTION, ARDAREPORT_NONCE_NAME);

        $attributes = [
            'id' => ARDAREPORT_Title_META_KEY,
            'name' => ARDAREPORT_Title_META_KEY,
            'value' => get_post_meta($post->ID, ARDAREPORT_Title_META_KEY, true),
            'class' => 'widefat ardareport_title',
            'type' => 'text',
            //'type' => 'url',
            'required' => 'required'
        ];

        $attributes = implode(' ', array_map(function ($key) use ($attributes) {
            return sprintf('%s="%s"', $key, esc_attr($attributes[$key]));
        }, array_keys($attributes)));

        echo '<label for=' . ARDAREPORT_Title_META_KEY . '>' . ARDAREPORT_Title_META_LABEL . '</label><input ' . $attributes . ' /><br/>';
        // add version field
        $value = get_post_meta($post->ID, ARDAREPORT_Historical_META_KEY, true);
        $attributes = [
            'id' => ARDAREPORT_Historical_META_KEY,
            'name' => ARDAREPORT_Historical_META_KEY,
            'value' => 'yes',
            'class' => 'widefat arda' . ARDAREPORT_Historical_META_KEY,
            'type' => 'checkbox', 
            'metavalue' => $value,
        ];

        $attributes = implode(' ', array_map(function ($key) use ($attributes) {
            return sprintf('%s="%s"', $key, esc_attr($attributes[$key]));
        }, array_keys($attributes)));

        echo '<label for=' . ARDAREPORT_Historical_META_KEY . '>' . ARDAREPORT_Historical_META_LABEL . '</label><input ' . $attributes . ' ' .  checked( $value, true, false) . '/><br/>';
        // add customer  field
        $attributes = [
            'id' => ARDAREPORT_Client_META_KEY,
            'name' => ARDAREPORT_Client_META_KEY,
            'value' => get_post_meta($post->ID, ARDAREPORT_Client_META_KEY, true),
            'class' => 'widefat ardareport_client',
        ];

        $attributes = implode(' ', array_map(function ($key) use ($attributes) {
            return sprintf('%s="%s"', $key, esc_attr($attributes[$key]));
        }, array_keys($attributes)));

        echo '<label for=' . ARDAREPORT_Client_META_KEY . '>' . ARDAREPORT_Client_META_LABEL . '</label>';


        $args = array(
            'post_type' => ARDACUSTOMER_POST_TYPE,
            'posts_per_page'   => -1,
            'post_status' => array( 'publish', 'private'  )  
        );
        $query = new WP_Query( $args );

       /* $query = new WP_Query(array(
            'post_type' => ARDACUSTOMER_POST_TYPE,
            'post_status' => 'publish',
            'numberposts' => -1
        ));*/

        $value = get_post_meta($post->ID, ARDAREPORT_Client_META_KEY, true);

        echo '<select ' . $attributes . '>';
        echo '<option value="">Select something...</option>';
        while ($query->have_posts()) {
            $query->the_post(); 
            $post_id = get_the_ID();
            $post_title = get_the_title();
            // selected() prints its result unless its third argument is false.
            echo '<option value="' . esc_attr($post_id) . '" ' .  selected($value, $post_id, false) . '>' . esc_html($post_title) .'</option>';
        }

        echo ' </select><br/>';
		
        wp_reset_query();



        $attributes = [
            'id' => ARDAREPORT_CONTEXT_META_KEY,
            'name' => ARDAREPORT_CONTEXT_META_KEY,
            'class' => 'widefat arda' . ARDAREPORT_CONTEXT_META_KEY,
            'type' => 'text',
            //'type' => 'url',
            'required' => 'required'
        ];

        $attributes = implode(' ', array_map(function ($key) use ($attributes) {
            return sprintf('%s="%s"', $key, esc_attr($attributes[$key]));
        }, array_keys($attributes)));

        echo '<label for=' . ARDAREPORT_CONTEXT_META_KEY . '>' . ARDAREPORT_CONTEXT_META_LABEL . '</label><textarea ' . $attributes . ' >' . esc_textarea(get_post_meta($post->ID, ARDAREPORT_CONTEXT_META_KEY, true)) . '</textarea><br/>';
    }, ARDAREPORT_POST_TYPE, 'advanced', 'core');
});

function myplugin_update_slug( $data, $postarr ) {
    if ( ! in_array( $data['post_status'], array( 'draft', 'pending', 'auto-draft' ) ) ) {
        $data['post_name'] = wp_unique_post_slug( sanitize_title( $data['post_title'] ), $postarr['ID'], $data['post_status'], $data['post_type'], $data['post_parent'] );
    }

    return $data;
}
add_filter( 'wp_insert_post_data', 'myplugin_update_slug', 99, 2 );
//hook the save action for Ardareport_type
add_action('save_post', function ($post_id) {
    if (!isset($_POST[ARDAREPORT_NONCE_NAME])) return;
    if (!wp_verify_nonce($_POST[ARDAREPORT_NONCE_NAME], ARDAREPORT_NONCE_ACTION)) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!isset($_POST[ARDAREPORT_Client_META_KEY])) return;
    if (!isset($_POST[ARDAREPORT_Title_META_KEY])) return;
    if (!isset($_POST[ARDAREPORT_CONTEXT_META_KEY])) return; 
    if (!current_user_can('edit_post', $post_id)) return;

    
    update_post_meta($post_id, ARDAREPORT_Client_META_KEY, sanitize_text_field($_POST[ARDAREPORT_Client_META_KEY]));
    update_post_meta($post_id, ARDAREPORT_Title_META_KEY, sanitize_text_field($_POST[ARDAREPORT_Title_META_KEY]));
    // A textarea: keep its line breaks.
    update_post_meta($post_id, ARDAREPORT_CONTEXT_META_KEY, sanitize_textarea_field(wp_unslash($_POST[ARDAREPORT_CONTEXT_META_KEY])));
    
    If( isset($_POST[ARDAREPORT_Historical_META_KEY]) ){
        update_post_meta($post_id, ARDAREPORT_Historical_META_KEY, true );
    }else{
        update_post_meta($post_id, ARDAREPORT_Historical_META_KEY, false );
    }
});

//Remove ‘Private’ from private post titles	
function remove_private_prefix($title)
{
    $title = str_replace('Private: ', '', $title);
    return $title;
}
add_filter('the_title', 'remove_private_prefix');

// Alway private post  
function default_post_visibility()
{
    global $post;

    if ('publish' == $post->post_status) {
        $visibility = 'public';
        $visibility_trans = __('Public');
    } elseif (!empty($post->post_password)) {
        $visibility = 'password';
        $visibility_trans = __('Password protected');
    } elseif ($post->type == 'post' && is_sticky($post->ID)) {
        $visibility = 'public';
        $visibility_trans = __('Public, Sticky');
    } else {
        $post->post_password = '';
        $visibility = 'private';
        $visibility_trans = __('Private');
    } ?>

    <script type="text/javascript">
        (function($) {
            try {
                $('#post-visibility-display').text('<?php echo $visibility_trans; ?>');
                $('#hidden-post-visibility').val('<?php echo $visibility; ?>');
                $('#visibility-radio-<?php echo $visibility; ?>').attr('checked', true);
            } catch (err) {}
        })(jQuery);
    </script>
<?php
}

add_action('post_submitbox_misc_actions', 'default_post_visibility');


add_action('wp_enqueue_scripts', 'my_admin_scripts');

function my_admin_scripts()
{
    wp_register_script('jQuery', 'https://code.jquery.com/jquery-3.7.0.min.js');
    wp_enqueue_script('jQuery');
    wp_register_script('BootstrapChart', 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.4.0/Chart.min.js');
    wp_enqueue_script('BootstrapChart');
    wp_register_script('ViewwJS', plugin_dir_url(__FILE__) . 'view.js');
    wp_enqueue_script('ViewwJS');
}

// The report style (screen and A4 print) and its fonts: on the Report pages and their archive
// only, not on the rest of the site.
add_action('wp_enqueue_scripts', function () {
    $post_type = sanitize_key(ARDAREPORT_POST_TYPE);
    if (!is_singular($post_type) && !is_post_type_archive($post_type)) {
        return;
    }
    wp_enqueue_style('ardareport-fonts', 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,400;0,700;1,400;1,700&family=Fira+Sans:wght@400;700&display=swap', array(), null);
    wp_enqueue_style('ardareport-report', ARDAREPORT_PLUGIN_URL . 'report.css', array('ardareport-fonts'), (string) filemtime(__DIR__ . '/report.css'));
    $image = get_option('ardareport_header_image');
    if ($image) {
        wp_add_inline_style('ardareport-report', ':root{--ardareport-header-image:url("' . esc_url_raw($image) . '");}');
    }
});

// Settings > General > Report header image: the cover image behind the report header, per site.
add_action('admin_init', function () {
    register_setting('general', 'ardareport_header_image', array('type' => 'string', 'sanitize_callback' => 'esc_url_raw', 'default' => ''));
    add_settings_field('ardareport_header_image', 'Report header image', function () {
        printf('<input type="url" id="ardareport_header_image" name="ardareport_header_image" class="regular-text code" value="%s" />', esc_attr(get_option('ardareport_header_image')));
        echo '<p class="description">URL of the image behind the header of the reports, e.g. copied from the Media Library.</p>';
    }, 'general', 'default', array('label_for' => 'ardareport_header_image'));
});
//
/**
 * Print Javascript plaintext in page footer.
 */
function front_print_footer_scripts()
{
    global $wp_query;
    $script = '';
    $keycc = "";
    $valcc = "";

    foreach (array_keys($_COOKIE) as &$value) {
        // strpos rather than str_starts_with, which needs PHP 8.
        if (strpos($value, 'wordpress_logged_in_') === 0) {
            $keycc = $value;
            $valcc =  $_COOKIE[$value];
        }
    }
    if ($keycc != "")
        if ($wp_query && $wp_query->post) {
            $cat = get_the_category();
            #var_dump($wp_query->post);
            #var_dump($cat);  

            $catname = '_' . $wp_query->post->post_name;
            if (!empty($cat)) {
                $catname = '_' . $cat[0]->category_nicename;
            }
            $script =  $script . '<div id="PrintPost" class="printlink"><div><a href="spietopdf:' . $wp_query->post->ID . ':' . $keycc . ':' . $valcc . ':' . the_date('Y-m-d', '', '', FALSE) . $catname . ' " >🖨️</a></div></div>';
        }


    $script = $script . '
			 			  
			<script id="module-plotly">
 	
						
			
						
						function Ardagram(index ) { 
							$( this ).html("");
							/*$( this ).parent("pre").attr("style", "text-align: center; background: none;");
							$( this ).removeClass("language-Ardagram");
							$( this ).processArdagram( this  );*/
						};
						 
						function barPlotly(index ) { 
							$( this ).parent("pre").attr("style", "text-align: center; background: none;");
							$( this ).removeClass("language-plotly");
							$( this ).processPlotly( this  , "bar");
						};

						function StorageEvolution(index ) { 
							$( this ).parent("pre").attr("style", "text-align: center; background: none;");
							$( this ).addClass("StorageEvolution").removeClass("language-StorageEvolution");
							$( this ).processPlotly( this  , "StorageEvolution");
						};
						function Multiline(index ) { 
							$( this ).parent("pre").attr("style", "text-align: center; background: none;");
							$( this ).addClass("Multiline").removeClass("language-Multiline");
							$( this ).processPlotly( this  , "Multiline");
						};
						function barstackedPlotly(index ) { 
							$( this ).parent("pre").attr("style", "text-align: center; background: none;");
							$( this ).addClass("barstacked").removeClass("language-plotlybarstacked");
							$( this ).processPlotly( this  , "barstacked");
						};
						function Volbarstacked(index ) { 
							$( this ).parent("pre").attr("style", "text-align: center; background: none;");
							$( this ).addClass("Volbarstacked").removeClass("language-Volbarstacked");
							$( this ).processPlotly( this  , "Volbarstacked");
						};
						function NasVolumeGraf(index ) { 
							$( this ).parent("pre").attr("style", "text-align: center; background: none;");
							$( this ).addClass("NasVolume").removeClass("language-NasVolume");
							$( this ).processPlotly( this  , "NasVolume");
						};
						function warningPie(index ) { 
							$( this ).parent("pre").attr("style", "text-align: center; background: none;");
							$( this ).addClass("warningPie").removeClass("language-warningPie");
							$( this ).processPlotly( this  , "warningPie");
						};
						function CommVaultJob(index ) { 
							$( this ).parent("pre").attr("style", "text-align: center; background: none;");
							$( this ).addClass("CommVaultJob").removeClass("language-CommVaultJob");
							$( this ).processPlotly( this  , "CommVaultJob");
						};
						   
		

  $(document).ready(function(){
    $.fn.myFunction = function(){ 
       			$(".language-plotly").each(barPlotly);
						$(".language-Multiline").each(Multiline);
						$(".language-StorageEvolution").each(StorageEvolution);
						$(".language-Volbarstacked").each(Volbarstacked);
						$(".language-plotlybarstacked").each(barstackedPlotly);
						$(".language-NasVolume").each(NasVolumeGraf);
						$(".language-warningPie").each(warningPie);
						$(".language-CommVaultJob").each(CommVaultJob);
						$(".language-Ardagram").each(Ardagram);
    } 
    $().myFunction();
    });              
			</script> 
		';
    echo $script; //preg_replace( '/\s+/', ' ', $script );
}

add_action('init', 'create_block_multi_block_block_init');
