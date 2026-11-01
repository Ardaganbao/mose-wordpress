<?php

/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

global $post;
$report_Context = get_post_meta($post->ID, ARDAREPORT_CONTEXT_META_KEY, true);
$customer_id = get_post_meta($post->ID, ARDAREPORT_Client_META_KEY, true);
$Historical_toShow = get_post_meta($post->ID, ARDAREPORT_Historical_META_KEY, true);
$report_address = "";


$report_author = $post->post_author;
$report_date =  get_the_date('d F Y');

function get_revisionList($post_wp)
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

	// At the end of your shortcode function, make sure to..
	return $output;
}

?>
<div <?php echo get_block_wrapper_attributes(); ?>>

	<h2>Introduction</h2>
	<h3>Context</h3>
	<p><?php echo $report_Context; ?></p>
	<h3>Author</h3>
	<ul>
		<li>Author: <?php echo  get_the_author_meta('display_name', $report_author); ?></li>
		<li>Date : <?php echo $report_date; ?></li>
	</ul>
	<?php
	if ($Historical_toShow) {
	?>
	<h3>Document Historical</h3>

	<?php echo get_revisionList($post); ?>
	<?php
	}
		?>	
	<?php
	if (!empty($customer_id)) {
	?>
		<h3>Contact Persons</h3>

		<?php
		$report_address = get_post_meta($customer_id, ARDACUSTOMER_ADDRESS_META_KEY, true);

		?>


		<p>Address:<br />
			<?php echo $report_address; ?>
		<?php
	}
		?>
</div>