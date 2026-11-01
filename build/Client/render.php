<?php

/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

global $post;
$customer_id = get_post_meta($post->ID, ARDAREPORT_Client_META_KEY, true);
 
echo '<div ' . get_block_wrapper_attributes() . '>';

if (empty($customer_id)) {
	echo 'No Customer Set !!';
} else {
	$customer   = get_post($customer_id);
	echo  $customer->post_title;
}
echo '</div>';
 