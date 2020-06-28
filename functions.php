<?php 
/**
 * Add your custom php code below. 
 * 
 * We recommend you to use "code-snippets" plugin instead: https://wordpress.org/plugins/code-snippets/
 **/

function enqueue() {
	
	// style registration

    wp_enqueue_style( 'parent-style', get_stylesheet_directory_uri() . '/style.css' );
	wp_register_style('plotcss',get_stylesheet_directory_uri().'/stylesheet/plottable.css');
	wp_register_style('omhvis',get_stylesheet_directory_uri().'/stylesheet/omh-web-visualizations-all.css');


	// script registration   	 
 	wp_register_script('d3',get_stylesheet_directory_uri().'/scripts/d3.js');
 	wp_register_script('st',get_stylesheet_directory_uri().'/scripts/start.js');
 	wp_register_script('init',get_stylesheet_directory_uri().'/scripts/init.js');
 	wp_register_script('d3min',get_stylesheet_directory_uri().'/scripts/d3.min.js');
 	wp_register_script('index',get_stylesheet_directory_uri().'/scripts/index.js');
 	wp_register_script('plot',get_stylesheet_directory_uri().'/scripts/plottable.js');
 	wp_register_script('mom',get_stylesheet_directory_uri().'/scripts/moment.js');
 	wp_register_script('omhvisjs',get_stylesheet_directory_uri().'/scripts/omh-web-visualizations-all.js');
 	wp_register_script('oneyr',get_stylesheet_directory_uri().'/scripts/1yr.js');
 	//  style enqueign 
 	wp_enqueue_style('plotcss');
 	wp_enqueue_style('omhvis');


 	// script enqueing
 	 wp_enqueue_script( 'd3');
 	 wp_enqueue_script( 'st');
 	 //wp_enqueue_script( 'init');
 	 wp_enqueue_script( 'd3min');
 	 wp_enqueue_script( 'index');
 	 wp_enqueue_script( 'plot');
 	 wp_enqueue_script( 'mom');
 	 wp_enqueue_script( 'omhvisjs');
 	 wp_enqueue_script( 'oneyr');

 	 }
add_action( 'wp_enqueue_scripts', 'enqueue' );