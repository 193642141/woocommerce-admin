<?php
/**
 * REST API Onboarding Plugins Controller
 *
 * Handles requests to install and activate depedent plugins.
 *
 * @package WooCommerce Admin/API
 */

namespace Automattic\WooCommerce\Admin\API;

defined( 'ABSPATH' ) || exit;

/**
 * Onboarding Plugin Controller.
 *
 * @package WooCommerce Admin/API
 * @extends WC_REST_Data_Controller
 */
class ShippingLabel extends \WC_REST_Data_Controller {
	/**
	 * Endpoint namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'wc-admin';

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'shippingplugin';

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/wcs-setup',
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'wcs_setup' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/wcs-assets',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'wcs_assets' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);
	}

	/**
	 * Check if a given request has access to manage plugins.
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return WP_Error|boolean
	 */
	public function update_item_permissions_check( $request ) {
		if ( ! current_user_can( 'install_plugins' ) ) {
			return new \WP_Error( 'woocommerce_rest_cannot_update', __( 'Sorry, you cannot manage plugins.', 'woocommerce-admin' ), array( 'status' => rest_authorization_required_code() ) );
		}
		return true;
	}

	/**
	 * Sets up WooCommerce Services.
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return WP_Error|array Plugin Status
	 */
	public function wcs_setup( $request ) {
		if ( ! method_exists( '\WC_Connect_Options', 'update_option' ) ) {
			return new \WP_Error(
				'woocommerce_rest_wcs_setup',
				__( 'WooCommerce Services could not be set up.', 'woocommerce-admin' ),
				500
			);
		}

		\WC_Connect_Options::update_option( 'tos_accepted', true );

		return array(
			'status' => 'success',
		);
	}

	/**
	 * Get front end asset URLs for WooCommerce Services.
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return WP_Error|array Plugin Status
	 */
	public function wcs_assets( $request ) {
		$js_url  = 'todo.js';
		$css_url = 'todo.css';

		return( array(
			'js_url'  => $js_url,
			'css_url' => $js_url,
			'status'  => 'success',
		) );
	}

}
