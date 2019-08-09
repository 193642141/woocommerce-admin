/** @format */
/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from 'newspack-components';
import { Component, Fragment } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { forEach } from 'lodash';
import { compose } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';

/**
 * Internal depdencies
 */
import { H, Stepper, Card } from '@woocommerce/components';
import { NAMESPACE } from 'wc-api/onboarding/constants';
import { recordEvent } from 'lib/tracks';
import { PLUGINS, getPluginName } from './utils';

class Plugins extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			step: 'install',
			isPending: true,
			isError: false,
			pluginsInstalled: 0,
			pluginsActivated: 0,
			connectUrl: '',
		};

		this.activatePlugins = this.activatePlugins.bind( this );
	}

	componentDidMount() {
		this.installPlugins();
	}

	componentDidUpdate( prevProps, prevState ) {
		if (
			this.state.pluginsInstalled !== prevState.pluginsInstalled &&
			this.state.pluginsInstalled === PLUGINS.length
		) {
			/* eslint-disable react/no-did-update-set-state */
			this.setState( {
				step: 'activate',
				isPending: false,
			} );
			/* eslint-enable react/no-did-update-set-state */
		}

		if (
			this.state.pluginsActivated !== prevState.pluginsActivated &&
			this.state.pluginsActivated === PLUGINS.length
		) {
			this.connectJetpack();
		}
	}

	installPlugins() {
		forEach( PLUGINS, async plugin => {
			const response = await this.doPluginAction( 'install', plugin );
			if ( 'success' === response.status ) {
				this.setState( state => ( {
					pluginsInstalled: state.pluginsInstalled + 1,
				} ) );
			}
		} );
	}

	activatePlugins( event ) {
		event.preventDefault();

		// Avoid double activating.
		const { isPending } = this.state;
		if ( isPending ) {
			return false;
		}

		this.setState( {
			isPending: true,
		} );

		recordEvent( 'storeprofiler_install_plugin' );

		forEach( PLUGINS, async plugin => {
			const response = await this.doPluginAction( 'activate', plugin );
			if ( 'success' === response.status ) {
				this.setState( state => ( {
					pluginsActivated: state.pluginsActivated + 1,
				} ) );
			}
		} );
	}

	getErrorMessage( action, plugin ) {
		return 'install' === action
			? sprintf(
					__( 'There was an error installing %s. Please try again.', 'woocommerce-admin' ),
					getPluginName( plugin )
				)
			: sprintf(
					__( 'There was an error activating %s. Please try again.', 'woocommerce-admin' ),
					getPluginName( plugin )
				);
	}

	async doPluginAction( action, plugin ) {
		try {
			const pluginResponse = await apiFetch( {
				path: `${ NAMESPACE }/onboarding/plugins/${ action }`,
				method: 'POST',
				data: {
					plugin,
				},
			} );
			return pluginResponse;
		} catch ( err ) {
			this.props.createNotice( 'error', this.getErrorMessage( action, plugin ) );
			this.setState( {
				isPending: false,
				isError: true,
			} );
		}
	}

	async connectJetpack() {
		try {
			const connectResponse = await apiFetch( {
				path: `${ NAMESPACE }/onboarding/plugins/connect-jetpack`,
			} );
			if ( connectResponse && connectResponse.connectAction ) {
				window.location = connectResponse.connectAction;
				return;
			}
			throw new Error();
		} catch ( err ) {
			this.props.createNotice( 'error', this.getErrorMessage( 'activate', 'jetpack' ) );
			this.setState( {
				isPending: false,
				isError: true,
			} );
		}
	}

	render() {
		const { step, isPending, isError } = this.state;
		return (
			<Fragment>
				<H className="woocommerce-profile-wizard__header-title">
					{ __( 'Enhance your store setup', 'woocommerce-admin' ) }
				</H>

				<Card className="woocommerce-profile-wizard__plugins-card">
					<Stepper
						isVertical={ true }
						currentStep={ step }
						isPending={ isPending }
						steps={ [
							{
								label: __( 'Install Jetpack and WooCommerce Services', 'woocommerce-admin' ),
								key: 'install',
							},
							{
								label: __( 'Activate Jetpack and WooCommerce Services', 'woocommerce-admin' ),
								key: 'activate',
							},
						] }
					/>

					<div className="woocommerce-profile-wizard__plugins-actions">
						{ isError && (
							<Button isPrimary onClick={ () => location.reload() }>
								{ __( 'Retry', 'woocommerce-admin' ) }
							</Button>
						) }

						{ ! isError &&
							'activate' === step && (
								<Button isPrimary isBusy={ isPending } onClick={ this.activatePlugins }>
									{ __( 'Activate & continue', 'woocommerce-admin' ) }
								</Button>
							) }
					</div>
				</Card>
			</Fragment>
		);
	}
}

export default compose(
	withDispatch( dispatch => {
		const { createNotice } = dispatch( 'core/notices' );
		return {
			createNotice,
		};
	} )
)( Plugins );
