<?php

/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

global $post;

/*
function get_revision($post_wp)
{
	$output = '';

	if (!$revisions = wp_get_post_revisions($post_wp)) {
		return $output;
	}

	$rows = '';
	foreach ($revisions as $revision) {
		if (!current_user_can('read_post', $revision->ID)) {
			continue;
		}

		$rows .= "\t<li>" . wp_post_revision_title_expanded($revision) . "</li>\n";
	}

	$output .= "<ul class='post-revisions hide-if-no-js'>\n";
	$output .= $rows;
	$output .= '</ul>';
	$output  = count($revisions) . '.0';

	// At the end of your shortcode function, make sure to..
	return $output;
}
?>
<div <?php echo get_block_wrapper_attributes(); ?>>
	Version <?php echo get_revision($post); ?><br />
	<?php echo get_the_date('d F Y'); ?>
</div>

*/