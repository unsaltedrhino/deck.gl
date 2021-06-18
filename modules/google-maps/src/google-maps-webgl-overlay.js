/* global google */
import {createDeckInstance, destroyDeckInstance, getViewState} from './webgl-utils';

const HIDE_ALL_LAYERS = () => false;

export default class GoogleMapsOverlay {
  constructor(props) {
    this.props = {};

    this._map = null;

    const overlay = new google.maps.WebglOverlayView();
    overlay.onAdd = this._onAdd.bind(this);
    overlay.onContextRestored = this._onContextRestored.bind(this);
    overlay.onRemove = this._onRemove.bind(this);
    overlay.draw = this._draw.bind(this);
    this._overlay = overlay;

    this.setProps(props);
  }

  /* Public API */

  setMap(map) {
    if (map === this._map) {
      return;
    }
    if (this._map) {
      this._overlay.setMap(null);
      this._map = null;
    }
    if (map) {
      this._map = map;
      this._overlay.setMap(map);
    }
  }

  setProps(props) {
    Object.assign(this.props, props);
    if (this._deck) {
      if (props.style) {
        Object.assign(this._deck.canvas.parentElement.style, props.style);
        props.style = null;
      }
      this._deck.setProps(props);
    }
  }

  pickObject(params) {
    return this._deck && this._deck.pickObject(params);
  }

  pickMultipleObjects(params) {
    return this._deck && this._deck.pickMultipleObjects(params);
  }

  pickObjects(params) {
    return this._deck && this._deck.pickObjects(params);
  }

  finalize() {
    this.setMap(null);
    if (this._deck) {
      destroyDeckInstance(this._deck);
      this._deck = null;
    }
  }

  /* Private API */
  _onAdd() {
    this._deck = createDeckInstance(this._map, this._overlay, this._deck, this.props);
  }

  _onContextRestored(gl) {
    console.log('_onContextRestored');
  }

  _onRemove() {
    // Clear deck canvas
    this._deck.setProps({layerFilter: HIDE_ALL_LAYERS});
  }

  _draw(gl, matrix, coordinateTransformer, layerState) {
    const deck = this._deck;

    const {width, height, left, top, zoom, pitch, latitude, longitude} = getViewState(
      this._map,
      coordinateTransformer
    );

    const canSyncWithGoogleMaps = pitch === 0;

    const parentStyle = deck.canvas.parentElement.style;
    parentStyle.left = `${left}px`;
    parentStyle.top = `${top}px`;

    deck.setProps({
      width,
      height,
      viewState: {latitude, longitude, zoom, repeat: true},
      // deck.gl cannot sync with the base map with zoom < 0 and/or tilt
      layerFilter: canSyncWithGoogleMaps ? this.props.layerFilter : HIDE_ALL_LAYERS
    });
    // Deck is initialized
    deck.redraw();
  }
}
