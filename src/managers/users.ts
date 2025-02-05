/**
 * @fileoverview Manager for the Box User Resource
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import BoxClient from '../box-client';
import urlPath from '../util/url-path';

// ------------------------------------------------------------------------------
// Private
// ------------------------------------------------------------------------------

const BASE_PATH = '/users',
	EMAIL_ALIASES_SUBRESOURCE = 'email_aliases',
	GROUP_MEMBERSHIPS_SUBRESOURCE = 'memberships',
	CURRENT_USER_ID = 'me';

// ------------------------------------------------------------------------------
// Public
// ------------------------------------------------------------------------------

/**
 * Simple manager for interacting with all 'User' endpoints and actions.
 *
 * @constructor
 * @param {BoxClient} client - The Box API Client that is responsible for making calls to the API
 * @returns {void}
 */
class Users {
	client: BoxClient;

	CURRENT_USER_ID!: string;

	constructor(client: BoxClient) {
		this.client = client;
	}

	/**
	 * Requests information for the Box user info associated with a given ID
	 *
	 * API Endpoint: '/users/:id'
	 * Method: GET
	 *
	 * @param {string} userID - The ID of the user to retrieve
	 * @param {Object} [options] - Additional options for the request. Can be left null in most cases.
	 * @param {Function} [callback] - passed the user info if it was acquired successfully
	 * @returns {Promise<Object>} A promise resolving to the user object
	 */
	get(userID: string, options?: Record<string, any>, callback?: Function) {
		var apiPath = urlPath(BASE_PATH, userID),
			params = {
				qs: options,
			};

		return this.client.wrapWithDefaultHandler(this.client.get)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Update some information about a user.
	 *
	 * API Endpoint: '/users/:id'
	 * Method: PUT
	 *
	 * @param {string} userID - The ID of the user to update
	 * @param {Object} updates - User fields to update
	 * @param {Function} [callback] - Passed the updated user information if it was acquired successfully
	 * @returns {Promise<Object>} A promise resolving to the updated user object
	 */
	update(userID: string, updates: Record<string, any>, callback?: Function) {
		var apiPath = urlPath(BASE_PATH, userID),
			params = {
				body: updates,
			};

		return this.client.wrapWithDefaultHandler(this.client.put)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Deletes a user in an enterprise account.
	 *
	 * API Endpoint: '/users/:userID'
	 * Method: DELETE
	 *
	 * @param {string} userID - The ID of the user to delete
	 * @param {Object} [options] - Additional options for the request. Can be left null in most cases.
	 * @param {boolean} [options.notify] - Determines if the destination user should receive email notification of the transfer.
	 * @param {boolean} [options.force] - Whether or not the user should be deleted even if this user still own files.
	 * @param {Function} [callback] - Empty response body passed if successful, error otherwise
	 * @returns {Promise<void>} A promise resolving to nothing
	 */
	delete(
		userID: string,
		options?: {
			notify?: boolean;
			force?: boolean;
		},
		callback?: Function
	) {
		var apiPath = urlPath(BASE_PATH, userID),
			params = {
				qs: options,
			};

		return this.client.wrapWithDefaultHandler(this.client.del)(
			apiPath,
			params,
			callback
		);
	}

	// @NOTE(mwiller) 2014-06-10: This does not include their primary email address!
	/**
	 * Get all linked email addresses for a user.
	 *
	 * API Endpoint: '/users/:id/email_aliases'
	 * Method: GET
	 *
	 * @param {string} userID - The ID of the user to retrieve email alises for
	 * @param {Function} [callback] - Passed the email aliases if successful
	 * @returns {Promise<Object>} A promise resolving to the collection of email aliases
	 */
	getEmailAliases(userID: string, callback?: Function) {
		var apiPath = urlPath(BASE_PATH, userID, EMAIL_ALIASES_SUBRESOURCE);
		return this.client.wrapWithDefaultHandler(this.client.get)(
			apiPath,
			null,
			callback
		);
	}

	/**
	 * Add a linked email address to a user's account.
	 *
	 * API Endpoint: '/users/:id/email_aliases'
	 * Method: POST
	 *
	 * @param {string} userID - The ID of the user to add an email alias to
	 * @param {string} email - The email address to add
	 * @param {Object} [options] - Optional parameters
	 * @param {boolean} [options.is_confirmed=false] Whether or not to attempt to auto-confirm the alias (for admins)
	 * @param {Function} [callback] - Passed the new alias if successful
	 * @returns {Promise<Object>} A promise resolving to the new email alias
	 */
	addEmailAlias(
		userID: string,
		email: string,
		options?: {
			is_confirmed?: boolean;
		} | Function,
		callback?: Function
	) {
		options = options || {};
		if (typeof options === 'function') {
			callback = options;
			options = {};
		}

		var apiPath = urlPath(BASE_PATH, userID, EMAIL_ALIASES_SUBRESOURCE),
			params = {
				body: {
					email,
					is_confirmed: false, // don't attempt to autoconfirm aliases for admins by default
				},
			};

		Object.assign(params.body, options);

		return this.client.wrapWithDefaultHandler(this.client.post)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Remove a linked email address from the current user by alias ID.
	 *
	 * API Endpoint: '/users/:id/email_aliases/:aliasID'
	 * Method: DELETE
	 *
	 * @param {string} userID - The ID of the user to remove the email alias from
	 * @param {string} aliasID - The ID of the linked email alias to remove
	 * @param {Function} [callback] - Passed nothing on success
	 * @returns {Promise<void>} A promise resolving to nothing
	 */
	removeEmailAlias(userID: string, aliasID: string, callback?: Function) {
		var apiPath = urlPath(
			BASE_PATH,
			userID,
			EMAIL_ALIASES_SUBRESOURCE,
			aliasID
		);
		return this.client.wrapWithDefaultHandler(this.client.del)(
			apiPath,
			null,
			callback
		);
	}

	/**
	 * Retrieve a list of group memberships for the user, which show which groups
	 * the user belongs to.  This ability is restricted to group admins.
	 *
	 * API Endpoint: '/users/:userID/memberships'
	 * Method: GET
	 *
	 * @param {string} userID - The ID of the user to get group memberships for
	 * @param {Object} [options] - Optional parameters, can be left null in most cases
	 * @param {int} [options.limit] - The number of memberships to retrieve
	 * @param {int} [options.offset] - Paging marker, retrieve records starting at this position in the list
	 * @param {Function} [callback] - Passed a list of memberships if successful, error otherwise
	 * @returns {Promise<Object>} A promise resolving to the collection of group memberships
	 */
	getGroupMemberships(
		userID: string,
		options?: {
			limit?: number;
			offset?: number;
		},
		callback?: Function
	) {
		var apiPath = urlPath(BASE_PATH, userID, GROUP_MEMBERSHIPS_SUBRESOURCE),
			params = {
				qs: options,
			};

		return this.client.wrapWithDefaultHandler(this.client.get)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Retrieve the user's avatar image.
	 *
	 * API Endpoint: '/users/:userID/avatar'
	 * Method: GET
	 *
	 * @param {string} userID The ID of the user whose avatar should be retrieved
	 * @param {Function} [callback] Passed a stream over the bytes of the avatar image if successful
	 * @returns {Promise<Readable>} A promise resolving to the image stream
	 */
	getAvatar(userID: string, callback?: Function) {
		var apiPath = urlPath(BASE_PATH, userID, 'avatar'),
			params = {
				streaming: true,
			};

		return this.client.get(apiPath, params).asCallback(callback);
	}

	// @NOTE(fschott) 2014-05-06: Still need to implement get, edit, create, etc.
	//  The problem is that they are only available to enterprise admins, so we'll
	//  first need to figure out how we want to handle access to those methods.
	//  Remove this comment once we have.
}

/** @const {string} */
Users.prototype.CURRENT_USER_ID = CURRENT_USER_ID;

/**
 * @module box-node-sdk/lib/managers/users
 * @see {@Link Users}
 */
export = Users;
