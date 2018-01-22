/* @flow */

import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { InviteButton } from '../../invite';
import { Toolbox } from '../../toolbox';

import { setFilmstripHovered } from '../actions';
import { shouldRemoteVideosBeVisible } from '../functions';

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * Web/React.
 *
 * @extends Component
 */
class Filmstrip extends Component<*> {
    _isHovered: boolean;

    _notifyOfHoveredStateUpdate: Function;

    _onMouseOut: Function;

    _onMouseOver: Function;

    /**
     * {@code Filmstrip} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether invite button rendering should be skipped,
         * by default it is. false
         */
        _hideInviteButton: PropTypes.bool,

        /**
         * Whether or not remote videos are currently being hovered over.
         */
        _hovered: PropTypes.bool,

        /**
         * Whether or not the remote videos should be visible. Will toggle
         * a class for hiding the videos.
         */
        _remoteVideosVisible: PropTypes.bool,

        /**
         * Updates the redux store with filmstrip hover changes.
         */
        dispatch: PropTypes.func,

        /**
         * Whether or not the conference is in filmstripOnly mode.
         */
        filmstripOnly: PropTypes.bool
    };

    /**
     * Initializes a new {@code Filmstrip} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Debounce the method for dispatching the new filmstrip handled state
        // so that it does not get called with each mouse movement event. This
        // also works around an issue where mouseout and then a mouseover event
        // is fired when hovering over remote thumbnails, which are not yet in
        // react.
        this._notifyOfHoveredStateUpdate
            = _.debounce(this._notifyOfHoveredStateUpdate, 100);

        // Cache the current hovered state for _updateHoveredState to always
        // send the last known hovered state.
        this._isHovered = false;

        // Bind event handlers so they are only bound once for every instance.
        this._onMouseOver = this._onMouseOver.bind(this);
        this._onMouseOut = this._onMouseOut.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        /**
         * Note: Appending of {@code RemoteVideo} views is handled through
         * VideoLayout. The views do not get blown away on render() because
         * ReactDOMComponent is only aware of the given JSX and not new appended
         * DOM. As such, when updateDOMProperties gets called, only attributes
         * will get updated without replacing the DOM. If the known DOM gets
         * modified, then the views will get blown away.
         */

        const filmstripClassNames = `filmstrip ${this.props._remoteVideosVisible
            ? '' : 'hide-videos'}`;

        return (
            <div className = { filmstripClassNames }>
                { this.props.filmstripOnly ? <Toolbox /> : null }
                <div
                    className = 'filmstrip__videos'
                    id = 'remoteVideos'>
                    <div
                        className = 'filmstrip__videos'
                        id = 'filmstripLocalVideo'
                        onMouseOut = { this._onMouseOut }
                        onMouseOver = { this._onMouseOver }>
                        { this.props.filmstripOnly
                            || this.props._hideInviteButton
                            ? null : <InviteButton /> }
                        <div id = 'filmstripLocalVideoThumbnail' />
                    </div>
                    <div
                        className = 'filmstrip__videos'
                        id = 'filmstripRemoteVideos'>
                        {/**
                          * This extra video container is needed for scrolling
                          * thumbnails in Firefox; otherwise, the flex
                          * thumbnails resize instead of causing overflow.
                          */}
                        <div
                            className = 'remote-videos-container'
                            id = 'filmstripRemoteVideosContainer'
                            onMouseOut = { this._onMouseOut }
                            onMouseOver = { this._onMouseOver } />
                    </div>
                </div>
            </div>
        );
    }

    /**
     * If the current hover state does not match the known hover state in redux,
     * dispatch an action to update the known hover state in redux.
     *
     * @private
     * @returns {void}
     */
    _notifyOfHoveredStateUpdate() {
        if (this.props._hovered !== this._isHovered) {
            this.props.dispatch(setFilmstripHovered(this._isHovered));
        }
    }

    /**
     * Updates the currently known mouseover state and attempt to dispatch an
     * update of the known hover state in redux.
     *
     * @private
     * @returns {void}
     */
    _onMouseOut() {
        this._isHovered = false;
        this._notifyOfHoveredStateUpdate();
    }

    /**
     * Updates the currently known mouseover state and attempt to dispatch an
     * update of the known hover state in redux.
     *
     * @private
     * @returns {void}
     */
    _onMouseOver() {
        this._isHovered = true;
        this._notifyOfHoveredStateUpdate();
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code Filmstrip}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _hovered: boolean,
 *     _hideInviteButton: boolean,
 *     _remoteVideosVisible: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _hovered: state['features/filmstrip'].hovered,
        _hideInviteButton: state['features/base/config'].iAmRecorder,
        _remoteVideosVisible: shouldRemoteVideosBeVisible(state)
    };
}

export default connect(_mapStateToProps)(Filmstrip);
