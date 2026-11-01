<?php
/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

 global $post;
 $report_title = get_post_meta( $post->ID, ARDAREPORT_Title_META_KEY, true );
 
?>
<div class="Wrapper_Wp-block-multiblic-Title">

<div <?php echo get_block_wrapper_attributes(); ?>>
	<?php echo $report_title; ?>
</div>
<h1 <?php echo get_block_wrapper_attributes(); ?>>
	<?php echo get_the_title(); ?>
</h1>
</div>
